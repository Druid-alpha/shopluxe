import React from 'react'
import { Link } from 'react-router-dom'
import { useGetMyOrdersQuery } from '@/features/orders/orderApi'
import { Button } from '@/components/ui/button'
import { estimateEtaRange } from '@/lib/eta'
import { CheckCircle2, Clock, Package, Truck, XCircle } from 'lucide-react'

const STATUS_META = {
  pending: { label: 'Pending', tone: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
  paid: { label: 'Paid', tone: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  processing: { label: 'Processing', tone: 'bg-slate-50 text-slate-700 border-slate-200', icon: Package },
  shipped: { label: 'Shipped', tone: 'bg-blue-50 text-blue-700 border-blue-100', icon: Truck },
  delivered: { label: 'Delivered', tone: 'bg-green-50 text-green-700 border-green-100', icon: CheckCircle2 },
  failed: { label: 'Failed', tone: 'bg-rose-50 text-rose-700 border-rose-100', icon: XCircle },
  cancelled: { label: 'Cancelled', tone: 'bg-gray-50 text-gray-500 border-gray-200', icon: XCircle },
}

const TRACK_STEPS = ['Placed', 'Processing', 'Shipped', 'Delivered']
const progressIndex = (status) => {
  switch (status) {
    case 'pending':
    case 'paid':
      return 0
    case 'processing':
      return 1
    case 'shipped':
      return 2
    case 'delivered':
      return 3
    default:
      return null
  }
}

export default function MyOrders() {
  const { data, isLoading, isError, refetch } = useGetMyOrdersQuery()
  const ordersRaw = data?.orders || data || []
  const orders = Array.isArray(ordersRaw)
    ? [...ordersRaw].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : []

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm animate-pulse space-y-4">
          <div className="h-6 w-48 bg-gray-100 rounded" />
          <div className="h-4 w-72 bg-gray-100 rounded" />
          <div className="h-24 w-full bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white border border-rose-100 rounded-2xl p-8 shadow-sm">
          <p className="text-rose-600 font-semibold">Unable to load your orders.</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <h1 className="text-2xl font-black text-gray-900">Track Your Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Follow your delivery progress and view each receipt.</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
          <p className="text-gray-600 font-medium">You have no orders yet.</p>
          <Button asChild className="mt-4">
            <Link to="/products">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusKey = String(order.status || 'pending').toLowerCase()
            const meta = STATUS_META[statusKey] || STATUS_META.pending
            const Icon = meta.icon
            const stepIndex = progressIndex(statusKey)
            const itemCount = order.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0
            const firstItem = order.items?.[0]?.title || 'Items'
            const returnStatus = order?.returnStatus && order.returnStatus !== 'none'
              ? order.returnStatus
              : null

            return (
              <div key={order._id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Order ID</p>
                    <p className="text-sm font-bold text-gray-900">{order._id}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {itemCount} item{itemCount !== 1 ? 's' : ''} · {firstItem}
                    </p>
                    {estimateEtaRange(order)?.label && (
                      <p className="text-xs font-semibold text-gray-500">{estimateEtaRange(order).label}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${meta.tone}`}>
                    <Icon size={14} />
                    {meta.label}
                  </span>
                </div>

                {stepIndex === null ? (
                  <div className="rounded-xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-[11px] font-semibold text-rose-700">
                    This order was {meta.label.toLowerCase()}. If you need help, reach support with this order ID.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {TRACK_STEPS.map((step, idx) => (
                        <span key={step} className={idx <= stepIndex ? 'text-gray-900' : ''}>
                          {step}
                        </span>
                      ))}
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full transition-all"
                        style={{ width: `${((stepIndex + 1) / TRACK_STEPS.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="text-sm text-gray-600">
                    Total: <span className="font-semibold text-gray-900">NGN {(order.totalAmount || 0).toLocaleString()}</span>
                  </div>
                  {returnStatus && (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      returnStatus === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : returnStatus === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : returnStatus === 'requested'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
                      Return {returnStatus}
                    </span>
                  )}
                  <div className="flex gap-3">
                    <Button variant="outline" asChild className="rounded-xl">
                      <Link to={`/orders/${order._id}`}>Track Order</Link>
                    </Button>
                    <Button asChild className="rounded-xl">
                      <Link to={`/orders/${order._id}`}>View Receipt</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
