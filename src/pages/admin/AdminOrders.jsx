import React from 'react'
import {
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
  useDeleteOrdersBulkMutation,
  useUpdateReturnStatusMutation,
  useAddReturnMessageMutation,
  useRefundOrderMutation
} from '@/features/orders/orderApi'
import { Loader2, RefreshCcw, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/CustomSelect"
import axios from '@/lib/axios'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog"

const formatMessageTime = (msg) => {
  const raw = msg?.createdAt || msg?.sentAt || msg?.timestamp || msg?.time || msg?.date
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}

export default function AdminOrders() {
  const { toast } = useToast()
  const orderStatusOptions = ['pending', 'processing', 'shipped', 'delivered']
  const [lastUpdated, setLastUpdated] = React.useState(null)
  const [showReservedOnly, setShowReservedOnly] = React.useState(false)
  const [showReturnOnly, setShowReturnOnly] = React.useState(false)
  const [nowTick, setNowTick] = React.useState(Date.now())
  const [returnNotes, setReturnNotes] = React.useState({})
  const [refundAmounts, setRefundAmounts] = React.useState({})
  const prevCountsRef = React.useRef(null)
  const [activeDrawerOrderId, setActiveDrawerOrderId] = React.useState(null)
  const isHexColor = (value) => typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value.trim())
  const formatVariantLabel = (item) => {
    const parts = []
    if (item?.variant?.sku) parts.push(`SKU ${item.variant.sku}`)
    if (item?.variant?.color) parts.push(`Color ${item.variant.color}`)
    if (item?.variant?.size) parts.push(`Size ${item.variant.size}`)
    return parts
  }
  const openDrawer = (orderId) => setActiveDrawerOrderId(orderId)
  const closeDrawer = () => setActiveDrawerOrderId(null)

  const playNotificationSound = React.useCallback((frequency = 880) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequency
      gain.gain.value = 0.05
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
      osc.onended = () => ctx.close()
    } catch (err) {
      // Audio might be blocked; ignore.
    }
  }, [])

  // Use RTK Query for fetching orders with polling
  const { data, isLoading, isError, isFetching, refetch } = useGetAllOrdersQuery(undefined, {
    pollingInterval: 15000 // Poll every 15s for new orders
  })

  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation()
  const [deleteOrder] = useDeleteOrderMutation()
  const [deleteOrdersBulk, { isLoading: isBulkDeleting }] = useDeleteOrdersBulkMutation()
  const [updateReturnStatus, { isLoading: isUpdatingReturn }] = useUpdateReturnStatusMutation()
  const [addReturnMessage, { isLoading: isSendingMessage }] = useAddReturnMessageMutation()
  const [refundOrder, { isLoading: isRefunding }] = useRefundOrderMutation()
  const [orderToDelete, setOrderToDelete] = React.useState(null)
  const [showBulkDelete, setShowBulkDelete] = React.useState(false)

  const orders = data?.orders || []
  const returnRequestCount = orders.filter(o => o?.returnStatus === 'requested').length
  const newOrderCount = orders.filter(o => {
    const status = String(o?.status || 'pending').toLowerCase()
    return status === 'pending' && o?.paymentStatus !== 'failed' && o?.paymentStatus !== 'refunded'
  }).length
  const filteredOrders = orders.filter(o => {
    if (showReservedOnly && o?.paymentStatus !== 'pending') return false
    if (showReturnOnly && o?.returnStatus !== 'requested') return false
    return true
  })
  const activeDrawerOrder = activeDrawerOrderId
    ? filteredOrders.find(o => o._id === activeDrawerOrderId)
    : null
  React.useEffect(() => {
    if (data) setLastUpdated(new Date().toLocaleString())
  }, [data])

  React.useEffect(() => {
    const current = { newOrderCount, returnRequestCount }
    if (!prevCountsRef.current) {
      prevCountsRef.current = current
      return
    }
    const prev = prevCountsRef.current
    const newOrdersDelta = current.newOrderCount - prev.newOrderCount
    const returnDelta = current.returnRequestCount - prev.returnRequestCount
    if (newOrdersDelta > 0) {
      toast({
        title: 'New order received',
        description: `${newOrdersDelta} new order${newOrdersDelta > 1 ? 's' : ''} just came in.`
      })
      playNotificationSound(880)
    }
    if (returnDelta > 0) {
      toast({
        title: 'New return request',
        description: `${returnDelta} return request${returnDelta > 1 ? 's' : ''} waiting for review.`
      })
      playNotificationSound(620)
    }
    prevCountsRef.current = current
  }, [newOrderCount, returnRequestCount, playNotificationSound, toast])

  React.useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  React.useEffect(() => {
    const pending = orders.filter(o => o?.paymentStatus === 'pending' && o?.expiresAt)
    if (pending.length === 0) return
    const nextExpiry = pending
      .map(o => new Date(o.expiresAt).getTime() - Date.now())
      .filter(ms => ms > 0)
      .sort((a, b) => a - b)[0]
    if (!nextExpiry) return
    const timer = setTimeout(() => {
      refetch()
    }, Math.min(nextExpiry + 1000, 60000))
    return () => clearTimeout(timer)
  }, [orders, refetch])

  const handleStatusUpdate = async (id, newValue) => {
    try {
      await updateStatus({ id, status: newValue }).unwrap()
      toast({ title: 'Success', description: `Order status updated to ${newValue}` })
    } catch (err) {
      toast({
        title: 'Error',
        description: err.data?.message || 'Update failed',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    if (!orderToDelete) return
    try {
      await deleteOrder(orderToDelete).unwrap()
      toast({ title: 'Order Deleted', description: 'The order has been permanently removed.' })
    } catch (err) {
      toast({ title: 'Error', description: err.data?.message || 'Failed to delete order', variant: 'destructive' })
    } finally {
      setOrderToDelete(null)
    }
  }

  const handleBulkDelete = async () => {
    if (filteredOrders.length === 0) return
    try {
      const ids = filteredOrders.map(order => order._id).filter(Boolean)
      const res = await deleteOrdersBulk(ids).unwrap()
      toast({
        title: 'Orders Deleted',
        description: `${res?.deleted ?? ids.length} order(s) removed.`
      })
      setShowBulkDelete(false)
    } catch (err) {
      toast({
        title: 'Error',
        description: err.data?.message || 'Failed to delete orders',
        variant: 'destructive'
      })
    }
  }

  const handleExport = async () => {
    try {
      const res = await axios.get('/admin/export/orders', { responseType: 'blob' })
      const blob = res.data
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `orders-${Date.now()}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast({ title: 'Export failed', description: err.message || 'Could not export orders', variant: 'destructive' })
    }
  }

  const handleReturnUpdate = async (id, status) => {
    try {
      const note = returnNotes[id] || ''
      const refundAmount = refundAmounts[id]
      if (status === 'refunded') {
        await refundOrder({ orderId: id, amount: refundAmount, reason: note }).unwrap()
        toast({ title: 'Refund processed', description: 'Payment refunded via Paystack.' })
      } else {
        await updateReturnStatus({ id, status, note, refundAmount }).unwrap()
        toast({ title: `Return ${status}`, description: 'Return status updated.' })
      }
      setReturnNotes(prev => ({ ...prev, [id]: '' }))
      setRefundAmounts(prev => ({ ...prev, [id]: '' }))
    } catch (err) {
      toast({ title: 'Error', description: err.data?.message || 'Failed to update return', variant: 'destructive' })
    }
  }

  const handleReturnMessage = async (id) => {
    const note = returnNotes[id] || ''
    if (!note.trim()) {
      toast({ title: 'Message required', description: 'Type a message before sending.', variant: 'destructive' })
      return
    }
    try {
      await addReturnMessage({ id, message: note }).unwrap()
      toast({ title: 'Message sent', description: 'Customer can see it in their order.' })
      setReturnNotes(prev => ({ ...prev, [id]: '' }))
    } catch (err) {
      toast({ title: 'Error', description: err.data?.message || 'Failed to send message', variant: 'destructive' })
    }
  }

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="animate-spin text-gray-400" size={40} />
      <p className="text-gray-500 font-medium">Loading orders...</p>
    </div>
  )

  if (isError) return (
    <div className="p-10 text-center text-red-500 font-medium">
      Failed to load orders. Please check your connection.
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Order Management</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
            Last updated: {lastUpdated || 'Just now'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCcw size={14} className={isFetching ? "animate-spin" : ""} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            Export Orders
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => setShowBulkDelete(true)}
            disabled={filteredOrders.length === 0 || isBulkDeleting}
          >
            {isBulkDeleting ? 'Deleting...' : 'Delete Filtered'}
          </Button>
          <button
            type="button"
            onClick={() => setShowReservedOnly(prev => !prev)}
            className={`h-8 px-4 rounded-full border text-[10px] font-black uppercase tracking-widest transition-colors ${showReservedOnly ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:text-black hover:border-black'}`}
            title="Show only pending payment (reserved) orders"
          >
            {showReservedOnly ? 'Reserved Only' : 'All Orders'}
          </button>
          <button
            type="button"
            onClick={() => setShowReturnOnly(prev => !prev)}
            className={`h-8 px-4 rounded-full border text-[10px] font-black uppercase tracking-widest transition-colors ${showReturnOnly ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-gray-500 border-gray-200 hover:text-black hover:border-black'}`}
            title="Show return requests"
          >
            {showReturnOnly ? 'Return Requests' : 'All Returns'}
          </button>
          {returnRequestCount > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100">
              {returnRequestCount} return request{returnRequestCount > 1 ? 's' : ''}
            </span>
          )}
          {newOrderCount > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">
              {newOrderCount} new order{newOrderCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Mobile cards */}
        <div className="lg:hidden p-4 space-y-4">
          {filteredOrders.map((order) => {
            const isReserved = order?.paymentStatus === 'pending'
            const expiresAt = order?.expiresAt ? new Date(order.expiresAt) : null
            const minutesLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - nowTick) / 60000)) : null
            return (
              <div key={order._id} className="rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-gray-900">#{String(order._id || '').slice(-8).toUpperCase()}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`inline-flex items-center justify-center h-7 px-3 text-[10px] font-bold uppercase rounded-full ${order.paymentStatus === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : order.paymentStatus === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : order.paymentStatus === 'refunded'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                    {order.paymentStatus || 'pending'}
                  </span>
                </div>
                {order.returnStatus && order.returnStatus !== 'none' && (
                  <span className={`inline-flex items-center justify-center h-7 px-3 text-[10px] font-bold uppercase rounded-full mt-2 ${order.returnStatus === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : order.returnStatus === 'rejected'
                      ? 'bg-rose-100 text-rose-700'
                      : order.returnStatus === 'refunded'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                    Return {order.returnStatus}
                  </span>
                )}

                <div className="mt-3 text-sm font-semibold text-gray-900">{order.user?.name || 'Guest'}</div>
                <div className="text-xs text-gray-400">{order.user?.email || 'N/A'}</div>

                <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Items: {order.items?.length || 0}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  {isReserved ? (
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100 w-fit">
                        {minutesLeft === 0 ? 'Expired' : 'Reserved'}
                      </span>
                      {minutesLeft !== null && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                          {minutesLeft === 0 ? 'Awaiting cleanup' : `Expires in ${minutesLeft} min`}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300">-</span>
                  )}
                  <span className="text-sm font-bold text-gray-900">₦{order.totalAmount?.toLocaleString()}</span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <Select
                    value={orderStatusOptions.includes(order.status) ? order.status : undefined}
                    onValueChange={(val) => handleStatusUpdate(order._id, val)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="h-9 w-full text-[11px] font-bold uppercase rounded-lg border-gray-200">
                      <SelectValue placeholder={order.status || 'pending'} />
                    </SelectTrigger>
                    <SelectContent side="bottom">
                      {orderStatusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setOrderToDelete(order._id)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-[10px] font-black uppercase tracking-widest"
                    onClick={() => openDrawer(order._id)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block max-h-[70vh] relative overflow-x-hidden">
          <table className="w-full min-w-0 text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="border-b border-gray-100 text-xs text-gray-500 font-bold uppercase tracking-widest">
                <th className="px-6 py-4 w-[160px]">Order</th>
                <th className="px-6 py-4 w-[220px]">Customer</th>
                <th className="px-6 py-4 w-[140px]">Items</th>
                <th className="px-6 py-4 w-[140px]">Status</th>
                <th className="px-6 py-4 text-right w-[140px]">Total</th>
                <th className="px-6 py-4 text-right w-[180px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => {
                const isReserved = order?.paymentStatus === 'pending'
                const expiresAt = order?.expiresAt ? new Date(order.expiresAt) : null
                const minutesLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - nowTick) / 60000)) : null
                return (
                <tr key={order._id} className="h-16 hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4 align-middle">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-gray-900 leading-none">#{String(order._id || '').slice(-8).toUpperCase()}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <div className="text-sm font-semibold text-gray-900">{order.user?.name || 'Guest'}</div>
                    <div className="text-xs text-gray-400 truncate">{order.user?.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-gray-50 text-gray-600 border border-gray-100">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <div className="flex flex-col gap-2">
                      <span className={`inline-flex items-center justify-center h-8 w-28 text-[10px] font-bold uppercase rounded-lg ${order.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : order.paymentStatus === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : order.paymentStatus === 'refunded'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                        {order.paymentStatus || 'pending'}
                      </span>
                      {order.returnStatus && order.returnStatus !== 'none' && (
                        <span className={`inline-flex items-center justify-center h-7 w-28 text-[9px] font-bold uppercase rounded-lg ${order.returnStatus === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : order.returnStatus === 'rejected'
                            ? 'bg-rose-100 text-rose-700'
                            : order.returnStatus === 'refunded'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                          Return {order.returnStatus}
                        </span>
                      )}
                      {isReserved && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-amber-700">
                          {minutesLeft === 0 ? 'Reserved: Expired' : `Reserved: ${minutesLeft}m`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right align-middle">
                    <span className="font-bold text-gray-900">₦{order.totalAmount?.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right align-middle">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-[10px] font-black uppercase tracking-widest"
                        onClick={() => openDrawer(order._id)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setOrderToDelete(order._id)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <p className="text-sm font-semibold">No orders found.</p>
            <div className="mt-4 flex items-center justify-center">
              <Button variant="outline" className="rounded-xl" onClick={() => refetch()}>Refresh</Button>
            </div>
          </div>
        )}
      </div>

      {activeDrawerOrder && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeDrawer}
          />
          <div className="absolute inset-y-0 right-0 w-full sm:w-[420px] bg-white shadow-2xl p-4 sm:p-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Order</p>
                <p className="text-lg font-black text-gray-900">#{String(activeDrawerOrder._id || '').slice(-8).toUpperCase()}</p>
              </div>
              <Button variant="outline" size="sm" onClick={closeDrawer}>Close</Button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Items</div>
                <div className="flex flex-wrap gap-2">
                  {activeDrawerOrder.items?.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-100 p-3 text-[11px]">
                      <div className="font-bold text-gray-900">{item.title || 'Product'} x{item.qty}</div>
                      {formatVariantLabel(item).length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.variant?.color && (
                            <span className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-500">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-gray-300 flex-shrink-0"
                                style={{ backgroundColor: isHexColor(item.variant.color) ? item.variant.color : undefined }}
                              />
                              {item.variant.color}
                            </span>
                          )}
                          {item.variant?.size && (
                            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest text-slate-600">
                              Size: {item.variant.size}
                            </span>
                          )}
                          {item.variant?.sku && (
                            <span className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest text-indigo-600">
                              SKU: {item.variant.sku}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-300 mt-1">Base product</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {activeDrawerOrder.returnReason && (
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-[11px] font-medium text-amber-800">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block mb-1">Customer Reason</span>
                  {activeDrawerOrder.returnReason}
                </div>
              )}

              {Array.isArray(activeDrawerOrder.returnMessages) && activeDrawerOrder.returnMessages.length > 0 && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-[11px] font-medium text-slate-700 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Message History</span>
                  {activeDrawerOrder.returnMessages.map((msg, idx) => {
                    const timeLabel = formatMessageTime(msg)
                    return (
                      <div key={idx} className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          {msg.by}{msg.status ? ` • ${msg.status}` : ''}{timeLabel ? ` • ${timeLabel}` : ''}
                        </span>
                        <span>{msg.message}</span>
                        {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {msg.attachments.map((url, fileIdx) => (
                              <a
                                key={`${url}-${fileIdx}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-black uppercase tracking-widest text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full"
                              >
                                View File {fileIdx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {['requested', 'approved'].includes(activeDrawerOrder?.returnStatus) && (
                <div className="space-y-2">
                  <textarea
                    value={returnNotes[activeDrawerOrder._id] || ''}
                    onChange={(e) => setReturnNotes(prev => ({ ...prev, [activeDrawerOrder._id]: e.target.value }))}
                    placeholder="Admin note (emailed to customer)"
                    className="w-full border rounded-xl p-3 text-[11px] font-medium placeholder:text-gray-300 focus:outline-none focus:border-black transition-all min-h-[80px]"
                  />
                  <input
                    type="number"
                    min="0"
                    value={refundAmounts[activeDrawerOrder._id] || ''}
                    onChange={(e) => setRefundAmounts(prev => ({ ...prev, [activeDrawerOrder._id]: e.target.value }))}
                    placeholder="Refund amount (optional)"
                    className="w-full border rounded-xl p-3 text-[11px] font-medium placeholder:text-gray-300 focus:outline-none focus:border-black transition-all"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-emerald-200 text-emerald-700 w-full"
                      disabled={activeDrawerOrder?.returnStatus !== 'requested' || isUpdatingReturn || isRefunding}
                      onClick={() => handleReturnUpdate(activeDrawerOrder._id, 'approved')}
                    >
                      Approve Return
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-rose-200 text-rose-700 w-full"
                      disabled={activeDrawerOrder?.returnStatus !== 'requested' || isUpdatingReturn || isRefunding}
                      onClick={() => handleReturnUpdate(activeDrawerOrder._id, 'rejected')}
                    >
                      Reject Return
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-blue-200 text-blue-700 w-full"
                      disabled={!['requested', 'approved'].includes(activeDrawerOrder?.returnStatus) || isUpdatingReturn || isRefunding}
                      onClick={() => handleReturnUpdate(activeDrawerOrder._id, 'refunded')}
                    >
                      Mark Refunded
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-gray-200 text-gray-700 w-full"
                    disabled={isSendingMessage}
                    onClick={() => handleReturnMessage(activeDrawerOrder._id)}
                  >
                    Send Message Only
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the order from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
              Delete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete filtered orders?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {filteredOrders.length} order(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
              Delete Orders
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


