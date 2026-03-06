import React from 'react'
import {
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation
} from '@/features/orders/orderApi'
import { Loader2, RefreshCcw, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/CustomSelect"
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

export default function AdminOrders() {
  const { toast } = useToast()
  const orderStatusOptions = ['pending', 'processing', 'shipped', 'delivered']

  // Use RTK Query for fetching orders with polling
  const { data, isLoading, isError, isFetching, refetch } = useGetAllOrdersQuery(undefined, {
    pollingInterval: 15000 // Poll every 15s for new orders
  })

  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation()
  const [deleteOrder] = useDeleteOrderMutation()
  const [orderToDelete, setOrderToDelete] = React.useState(null)

  const orders = data?.orders || []

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
                <th className="px-6 py-4 text-right">Actions</th>
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

                      {/* Operational Status Dropdown */}
                      <Select
                        value={orderStatusOptions.includes(order.status) ? order.status : undefined}
                        onValueChange={(val) => handleStatusUpdate(order._id, val)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="h-8 w-32 text-[11px] font-bold uppercase rounded-lg border-gray-200">
                          <SelectValue placeholder={order.status || 'pending'} />
                        </SelectTrigger>
                        <SelectContent side="left">
                          {orderStatusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-gray-900">₦{order.totalAmount?.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setOrderToDelete(order._id)}
                    >
                      <Trash2 size={18} />
                    </Button>
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
    </div>
  )
}
