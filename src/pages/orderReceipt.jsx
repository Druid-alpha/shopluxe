import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Download, ChevronLeft, LogOut, CheckCircle2 } from 'lucide-react'
import html2pdf from 'html2pdf.js'
import { useAppDispatch } from '@/app/hooks'
import { logout } from '@/features/auth/authSlice'
import { authApi } from '@/features/auth/authApi'
import { productApi } from '@/features/products/productApi'

export default function OrderReceipt() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const receiptRef = useRef(null)

  useEffect(() => {
    // 🔥 Force refresh products and featured list so stock reduction is reflected
    dispatch(productApi.util.invalidateTags(['Product']))

    fetch(`${import.meta.env.VITE_API_URL}/orders/${id}`, {
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error('Order not found or unauthorized')
        return res.json()
      })
      .then(data => {
        if (data.order) setOrder(data.order)
        else throw new Error('Invalid order data')
      })
      .catch(err => {
        console.error('Fetch error:', err)
        setError(err.message)
      })
  }, [id, dispatch])

  const downloadPDF = () => {
    const element = receiptRef.current
    const opt = {
      margin: 1,
      filename: `Invoice_${order._id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  }

  const handleLogout = async () => {
    try {
      await authApi.endpoints.logout.initiate().unwrap()
      dispatch(logout())
      navigate('/login')
    } catch (err) {
      console.error('Logout failed:', err)
      // Fallback
      dispatch(logout())
      navigate('/login')
    }
  }

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="bg-red-50 p-4 rounded-full text-red-500"><LogOut size={32} /></div>
      <h2 className="text-xl font-bold">Failed to load order</h2>
      <p className="text-gray-500 max-w-xs">{error}</p>
      <Button onClick={() => navigate('/')}>Back to Shop</Button>
    </div>
  )

  if (!order) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      <p className="text-gray-500 font-medium animate-pulse text-sm">Generating your premium receipt...</p>
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
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Purchase Successful</h1>
              <p className="text-gray-500 text-sm">A copy of this receipt has been sent to your email.</p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {order.invoiceUrl && (
              <Button asChild variant="outline" className="flex-1 md:flex-none border-gray-200 text-gray-700 rounded-xl h-12 px-6 font-bold flex items-center gap-2">
                <a href={order.invoiceUrl} target="_blank" rel="noopener noreferrer">
                  <Download size={18} /> Official Invoice
                </a>
              </Button>
            )}
            <Button onClick={downloadPDF} className="flex-1 md:flex-none bg-black hover:bg-gray-800 text-white rounded-xl h-12 px-6 font-bold flex items-center gap-2">
              <Download size={18} /> Download
            </Button>
          </div>
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
                <p className="text-gray-500">123 Premium Way, Victoria Island</p>
                <p className="text-gray-500">Lagos, 100001</p>
                <p className="text-gray-500 font-mono tracking-tighter">support@shopluxe.com</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 pt-12 border-t border-gray-50">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Billed To</h4>
                <div className="space-y-1">
                  <p className="font-bold text-xl text-gray-900">{order.shippingAddress?.fullName || 'Valued Customer'}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{order.shippingAddress?.address}</p>
                  <p className="text-gray-500 text-sm">{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                  <p className="text-gray-500 text-sm italic">Nigeria</p>
                </div>
              </div>
              <div className="space-y-4 sm:text-right">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Invoice Details</h4>
                <div className="space-y-2">
                  <p className="text-sm font-medium"><span className="text-gray-400 mr-2">Issue Date:</span> {new Date(order.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
                  <p className="text-sm font-medium">
                    <span className="text-gray-400 mr-2">Status:</span>
                    <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase italic tracking-wider">
                      {order.paymentStatus}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="mt-12">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                    <th className="pb-4 font-black">Description</th>
                    <th className="pb-4 text-center font-black">Quantity</th>
                    <th className="pb-4 text-right font-black">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-6">
                        <p className="font-bold text-gray-900">{item.product.title}</p>
                        {item.variant && (
                          <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-tighter">Variant: {item.variant.sku || item.variant}</p>
                        )}
                      </td>
                      <td className="py-6 text-center font-mono text-gray-500">{item.qty}</td>
                      <td className="py-6 text-right font-bold text-gray-900 italic">₦{item.priceAtPurchase?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-10 border-t-2 border-dashed border-gray-100">
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
            <div className="pt-20 text-center space-y-6">
              <p className="text-gray-400 text-[10px] font-medium leading-relaxed max-w-sm mx-auto">
                Thank you for choosing ShopLuxe. We appreciate your business and hope you enjoy your premium selection.
              </p>
              <div className="flex items-center justify-center gap-2 opacity-30">
                <div className="h-[1px] w-8 bg-black"></div>
                <span className="text-[8px] font-black uppercase tracking-[0.5em]">Authentic Selection</span>
                <div className="h-[1px] w-8 bg-black"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Post-Purchase Navigation */}
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
