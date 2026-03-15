import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Download, ChevronLeft, LogOut, CheckCircle2, Clock } from 'lucide-react'
import html2pdf from 'html2pdf.js'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/features/auth/authSlice'
import { productApi } from '@/features/products/productApi'
import { useGenerateOrderInvoiceMutation, useGetOrderQuery, useRequestReturnMutation } from '@/features/orders/orderApi'
import { useToast } from '@/hooks/use-toast'
import { estimateEtaRange } from '@/lib/eta'

export default function OrderReceipt() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const token = useAppSelector(state => state.auth.token)
  const { toast } = useToast()
  const receiptRef = React.useRef(null)

  const { data, isLoading, error: queryError, refetch } = useGetOrderQuery(id, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
    refetchOnFocus: true
  })
  const [generateInvoice, { isLoading: isGeneratingInvoice }] = useGenerateOrderInvoiceMutation()
  const [requestReturn, { isLoading: isRequestingReturn }] = useRequestReturnMutation()
  const [isDownloading, setIsDownloading] = React.useState(false)
  const [invoiceUrl, setInvoiceUrl] = React.useState(null)
  const [returnReason, setReturnReason] = React.useState('')
  const order = data?.order
  const eta = estimateEtaRange(order)
  const timelineSteps = ['pending', 'paid', 'processing', 'shipped', 'delivered']
  const statusIndex = timelineSteps.indexOf(order?.status || 'pending')
  const paymentIndex = order?.paymentStatus === 'paid' ? timelineSteps.indexOf('paid') : timelineSteps.indexOf('pending')
  const currentStepIndex = Math.max(statusIndex, paymentIndex)
  const statusTone = (() => {
    const status = String(order?.status || 'pending').toLowerCase()
    if (status === 'delivered') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    if (status === 'shipped') return 'bg-blue-50 text-blue-700 border-blue-100'
    if (status === 'processing') return 'bg-slate-50 text-slate-700 border-slate-200'
    if (status === 'paid') return 'bg-green-50 text-green-700 border-green-100'
    if (status === 'failed') return 'bg-rose-50 text-rose-700 border-rose-100'
    if (status === 'cancelled') return 'bg-gray-50 text-gray-500 border-gray-200'
    return 'bg-amber-50 text-amber-700 border-amber-100'
  })()

  const getVariantMeta = (item) => {
    if (!item) return null
    if (item.variantLabel) return { label: 'Variant', value: item.variantLabel }

    const variantObj = item.variantPayload || item.variant
    if (!variantObj || typeof variantObj !== 'object') return null

    const colorValue = variantObj.color
    const colorName = typeof colorValue === 'string'
      ? colorValue
      : (colorValue?.name || '')
    const sizeValue = variantObj.size || ''
    const parts = [colorName, sizeValue].filter(Boolean)

    const skuValue = variantObj.sku || item.variantSku || item.sku || ''
    const isBaseLike = !variantObj.sku && !variantObj._id

    if (parts.length > 0) {
      return { label: isBaseLike ? 'Main Product' : 'Variant', value: parts.join(' / ') }
    }
    if (skuValue) return { label: 'Variant', value: `SKU: ${skuValue}` }
    return { label: 'Main Product', value: '' }
  }

  // Poll while payment is still pending
  React.useEffect(() => {
    if (order?.paymentStatus === 'pending') {
      const timer = setInterval(() => refetch(), 3000)
      return () => clearInterval(timer)
    }
  }, [order?.paymentStatus, refetch])

  React.useEffect(() => {
    if (id) refetch()
  }, [id, refetch])

  // Invalidate product cache once paid so stock reflects
  React.useEffect(() => {
    if (order?.paymentStatus === 'paid') {
      dispatch(productApi.util.invalidateTags(['Product']))
    }
  }, [order?.paymentStatus, dispatch])

  React.useEffect(() => {
    if (order?.invoiceUrl) {
      setInvoiceUrl(order.invoiceUrl)
    }
  }, [order?.invoiceUrl])

  React.useEffect(() => {
    if (order?.paymentStatus === 'paid' && !order?.invoiceUrl) {
      generateInvoice(order._id).unwrap()
        .then((res) => {
          if (res?.invoiceUrl) setInvoiceUrl(res.invoiceUrl)
        })
        .catch(() => {
          // ignore; user can retry with button
        })
    }
  }, [order?.paymentStatus, order?._id, order?.invoiceUrl, generateInvoice])

  const downloadPDF = async () => {
    if (!order?._id) return
    if (order?.paymentStatus !== 'paid') {
      toast({
        title: 'Payment pending',
        description: 'Invoice is available after payment confirmation.',
        variant: 'destructive'
      })
      return
    }
    setIsDownloading(true)
    const opt = {
      margin: 0,
      filename: `ShopLuxe_Invoice_${order?._id?.slice(-6) || 'receipt'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    const isMobileDevice = /android|iphone|ipad|ipod/i.test(navigator.userAgent || '')
    const downloadViaApi = async (url) => {
      const filename = opt.filename.endsWith('.pdf') ? opt.filename : `${opt.filename}.pdf`
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      if (!res.ok) throw new Error(`Download failed: ${res.status}`)
      const blob = await res.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      if (isMobileDevice) {
        window.open(objectUrl, '_blank', 'noopener')
        window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 5000)
        return true
      }
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(objectUrl)
      return true
    }

    let usedFallback = false
    try {
      const backendUrl = `${import.meta.env.VITE_API_URL}/orders/${order._id}/invoice/download`
      toast({
        title: 'Download started',
        description: 'Your invoice is being prepared.',
      })
      await downloadViaApi(backendUrl)
      refetch()
      return
    } catch (err) {
      try {
        // Ensure invoice exists if download failed, then retry once.
        await generateInvoice(order._id).unwrap()
        const backendUrl = `${import.meta.env.VITE_API_URL}/orders/${order._id}/invoice/download`
        toast({
          title: 'Download started',
          description: 'Your invoice is being prepared.',
        })
        await downloadViaApi(backendUrl)
        refetch()
        return
      } catch (retryErr) {
        console.error('Official invoice download failed:', retryErr)
      }
      console.error('Official invoice download failed:', err)
      usedFallback = true
    } finally {
      setIsDownloading(false)
    }

    if (usedFallback) {
      try {
        toast({
          title: 'Downloading receipt PDF',
          description: 'Using the on-page receipt as a fallback.',
        })
        await html2pdf().set(opt).from(receiptRef.current).save()
      } catch (fallbackErr) {
        console.error('Fallback PDF download failed:', fallbackErr)
        toast({
          title: 'Invoice download failed',
          description: 'Please try again in a moment.',
          variant: 'destructive'
        })
      }
    }
  }

  const handleLogout = async () => {
    dispatch(logout())
    navigate('/login')
  }

  const handleReturnRequest = async () => {
    if (!order?._id) return
    try {
      await requestReturn({ id: order._id, reason: returnReason }).unwrap()
      toast({ title: 'Return requested', description: 'We will review your request shortly.' })
      setReturnReason('')
      refetch()
    } catch (err) {
      toast({
        title: 'Return request failed',
        description: err?.data?.message || 'Please try again.',
        variant: 'destructive'
      })
    }
  }

  if (queryError) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="bg-red-50 p-4 rounded-full text-red-500"><LogOut size={32} /></div>
      <h2 className="text-xl font-bold">Failed to load order</h2>
      <p className="text-gray-500 max-w-xs">{queryError?.data?.message || 'Access denied or network error'}</p>
      <Button onClick={() => navigate('/')}>Back to Shop</Button>
    </div>
  )

  if (isLoading || !order) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
      <p className="text-gray-500 font-medium animate-pulse text-sm">Loading your receipt...</p>
    </div>
  )

  // Show pending state if payment hasn't been confirmed yet
  if (order.paymentStatus === 'pending') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full bg-amber-100 animate-ping opacity-50" />
        <div className="relative w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
          <Clock size={36} className="text-amber-500 animate-pulse" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Awaiting Payment Confirmation</h2>
        <p className="text-gray-500 text-sm mt-2">We're waiting for your payment to be confirmed. This page will update automatically.</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Success Header */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-green-100 p-3 rounded-2xl">
              <CheckCircle2 className="text-green-600" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-display">Purchase Successful</h1>
              <p className="text-gray-500 text-sm">A copy of this receipt has been sent to your email.</p>
              <div className="mt-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusTone}`}>
                  {order?.status || 'pending'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button
              onClick={downloadPDF}
              disabled={isGeneratingInvoice || isDownloading}
              className="flex-1 bg-black text-white hover:bg-gray-800 h-10 md:h-12 rounded-lg text-xs md:text-sm font-bold shadow-lg transition-all active:scale-95"
            >
              <Download className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              {isGeneratingInvoice || isDownloading
                ? 'Preparing Invoice...'
                : invoiceUrl
                  ? 'Download Official Invoice'
                  : 'Generate & Download PDF'}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Order Timeline</p>
          <div className="grid grid-cols-5 gap-2">
            {timelineSteps.map((step, idx) => {
              const isActive = idx <= currentStepIndex
              return (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-black' : 'bg-gray-200'}`} />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Returns</p>
              <p className="text-sm font-semibold text-gray-900">
                {order.returnStatus && order.returnStatus !== 'none'
                  ? `Status: ${order.returnStatus}`
                  : 'Request a return within 7 days of delivery.'}
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${order.returnStatus === 'approved'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : order.returnStatus === 'rejected'
                ? 'bg-rose-50 text-rose-700 border-rose-100'
                : order.returnStatus === 'requested'
                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                  : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
              {order.returnStatus || 'none'}
            </span>
          </div>

          {order.status === 'delivered' && order.returnStatus === 'none' && (
            <div className="space-y-3">
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Why do you want to return this order?"
                className="w-full border rounded-xl p-4 text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:border-black transition-all min-h-[100px]"
              />
              <Button
                onClick={handleReturnRequest}
                disabled={isRequestingReturn}
                className="h-11 rounded-xl bg-black text-white hover:bg-gray-800"
              >
                {isRequestingReturn ? 'Submitting...' : 'Request Return'}
              </Button>
            </div>
          )}
        </div>

        {/* Invoice Card */}
        <div
          ref={receiptRef}
          className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden"
        >
          {/* Decorative Top Bar */}
          <div className="h-2 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 w-full" />

          <div className="p-8 md:p-16 space-y-16">
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-10">
              <div className="space-y-6">
                <div className="text-3xl font-black italic tracking-tighter">ShopLuxe<span className="text-gray-400">.</span></div>
                <div>
                  <h2 className="text-5xl font-black tracking-tighter text-gray-900">INVOICE</h2>
                  <div className="flex items-center gap-3 mt-4 text-sm font-medium text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">No.</span>
                    <span className="font-mono">{order._id.slice(-12).toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right space-y-1 text-sm">
                <p className="font-bold text-gray-900 text-lg">ShopLuxe Ltd.</p>
                <p className="text-gray-500">Zone 7, Ota-Efun Osogbo</p>
                <p className="text-gray-500">Osun, 230281</p>
                <p className="text-gray-500 font-mono">support@shopluxe.com</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 pt-12 border-t border-gray-50">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Billed To</h4>
                <div className="space-y-1">
                  <p className="font-bold text-xl text-gray-900">
                    {order.shippingAddress?.fullName || order.user?.name || 'Valued Customer'}
                  </p>
                  {order.shippingAddress?.phone && (
                    <p className="text-gray-500 text-sm">Tel: {order.shippingAddress.phone}</p>
                  )}
                  {order.shippingAddress?.address && (
                    <p className="text-gray-500 text-sm leading-relaxed">{order.shippingAddress.address}</p>
                  )}
                  {(order.shippingAddress?.city || order.shippingAddress?.state) && (
                    <p className="text-gray-500 text-sm">
                      {order.shippingAddress.city}{order.shippingAddress.city && order.shippingAddress.state ? ', ' : ''}{order.shippingAddress.state}
                    </p>
                  )}
                  <p className="text-gray-500 text-sm italic">Nigeria</p>
                </div>
              </div>
              <div className="space-y-4 sm:text-right">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Invoice Details</h4>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    <span className="text-gray-400 mr-2">Issue Date:</span>
                    {new Date(order.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
                  </p>
                  {eta?.label && (
                    <p className="text-sm font-medium">
                      <span className="text-gray-400 mr-2">Estimated Delivery:</span>
                      {eta.label.replace('ETA: ', '')}
                    </p>
                  )}
                  <p className="text-sm font-medium">
                    <span className="text-gray-400 mr-2">Status:</span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase italic tracking-wider ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {order.paymentStatus}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-10" style={{ breakInside: 'avoid' }}>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                    <th className="pb-4 font-black">Description</th>
                    <th className="pb-4 text-center font-black">Qty</th>
                    <th className="pb-4 text-right font-black">Unit Price</th>
                    <th className="pb-4 text-right font-black">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item, idx) => {
                    const variantMeta = getVariantMeta(item)
                    return (
                      <tr key={idx}>
                      <td className="py-6">
                        {/* Use item.title directly - product may not be populated */}
                        <p className="font-bold text-gray-900">{item.title || (item.product?.title) || 'Product'}</p>
                        {variantMeta && (variantMeta.value || variantMeta.label) && (
                          <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-tighter">
                            {variantMeta.label}{variantMeta.value ? `: ${variantMeta.value}` : ''}
                          </p>
                        )}
                      </td>
                      <td className="py-6 text-center font-mono text-gray-500">{item.qty}</td>
                      <td className="py-6 text-right text-gray-500 text-sm">₦{(item.priceAtPurchase || 0).toLocaleString()}</td>
                      <td className="py-6 text-right font-bold text-gray-900 italic">
                        ₦{((item.priceAtPurchase || 0) * item.qty).toLocaleString()}
                      </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-10 border-t-2 border-dashed border-gray-100" style={{ breakInside: 'avoid' }}>
              <div className="w-full sm:w-72 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-medium">Subtotal</span>
                  <span className="font-bold text-gray-900 italic">₦{order.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-medium">Processing Fee</span>
                  <span className="font-bold text-gray-900 italic">₦0.00</span>
                </div>
                <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-900">Total Charged</span>
                  <span className="text-3xl font-black text-gray-900 tracking-tighter italic">₦{order.totalAmount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-20 text-center space-y-4">
              <p className="text-gray-400 text-[10px] font-medium leading-relaxed max-w-sm mx-auto">
                Thank you for choosing ShopLuxe. We appreciate your business and hope you enjoy your premium selection.
              </p>
              <div className="flex items-center justify-center gap-2 opacity-30">
                <div className="h-[1px] w-8 bg-black" />
                <span className="text-[8px] font-black uppercase tracking-[0.5em]">Authentic Selection</span>
                <div className="h-[1px] w-8 bg-black" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4 pb-12">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full sm:w-auto h-14 px-10 rounded-2xl border-gray-200 hover:bg-white hover:border-black font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <ChevronLeft size={18} /> Continue Shopping
          </Button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full sm:w-auto h-14 px-10 rounded-2xl text-red-600 hover:bg-red-50 font-bold transition-all flex items-center gap-2"
          >
            <LogOut size={18} /> Secure Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
