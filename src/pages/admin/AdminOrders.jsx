import React, { useEffect, useState } from 'react'
import { useAppSelector } from '@/app/hooks'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const token = useAppSelector(state => state.auth.token)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
          credentials: 'include',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        })

        if (!res.ok) throw new Error('Unauthorized')

        const data = await res.json()
        setOrders(data.orders || [])
      } catch (err) {
        console.error('Failed to fetch orders:', err)
        setOrders([])
      }
    }

    fetchOrders()
  }, [])

  if (!orders.length) {
    return <p>No orders found</p>
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 italic text-sm text-gray-500">
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Items</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-xs font-mono text-gray-400">#{order._id.slice(-8)}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-900">{order.user?.name || 'Guest'}</div>
                  <div className="text-xs text-gray-400 capitalize">{order.user?.email || 'N/A'}</div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600 line-clamp-1 max-w-xs">
                    {order.items
                      .map((i) => i.product?.title)
                      .filter(Boolean)
                      .join(', ')}
                  </p>
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
  )
}
