import React, { useEffect } from 'react'
import { useAppDispatch } from '@/app/hooks'
import {
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation
} from '@/features/orders/orderApi'
import { Loader2, RefreshCcw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { productApi } from '@/features/products/productApi'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"

export default function AdminOrders() {
  const dispatch = useAppDispatch()
  const { toast } = useToast()

  // Use RTK Query for fetching orders with polling
  const { data, isLoading, isError, refetch } = useGetAllOrdersQuery(undefined, {
    pollingInterval: 15000 // Poll every 15s for new orders
  })

  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation()

  const orders = data?.orders || []

  const handleStatusUpdate = async (id, newValue, field = 'status') => {
    try {
      const payload = { id }
      if (field === 'status') payload.status = newValue
      else payload.paymentStatus = newValue

      await updateStatus(payload).unwrap()
      toast({ title: 'Success', description: `Order ${field} updated to ${newValue}` })

      // If we manually mark as paid, refresh products to show stock reduction
      if (newValue === 'paid' && field === 'paymentStatus') {
        dispatch(productApi.util.invalidateTags(['Product']))
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err.data?.message || 'Update failed',
        variant: 'destructive'
      })
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Order Management</h2>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCcw size={14} /> Refresh
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Order Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Labels</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-gray-900 leading-none">#{String(order._id || '').slice(-8).toUpperCase()}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{order.user?.name || 'Guest'}</div>
                    <div className="text-xs text-gray-400">{order.user?.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {order.items?.map((item, idx) => (
                        <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-medium text-gray-600 border border-gray-200">
                          {item.title || 'Product'} x{item.qty}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      {/* Payment Status Dropdown */}
                      <Select
                        defaultValue={order.paymentStatus}
                        onValueChange={(val) => handleStatusUpdate(order._id, val, 'paymentStatus')}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className={`h-8 w-28 text-[10px] font-bold uppercase rounded-lg border-none shadow-none text-center ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Operational Status Dropdown */}
                      <Select
                        defaultValue={order.status}
                        onValueChange={(val) => handleStatusUpdate(order._id, val, 'status')}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="h-8 w-32 text-[11px] font-bold uppercase rounded-lg border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent side="left">
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-gray-900">₦{order.totalAmount?.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="p-12 text-center text-gray-500 italic">No orders found.</div>
        )}
      </div>
    </div>
  )
}
