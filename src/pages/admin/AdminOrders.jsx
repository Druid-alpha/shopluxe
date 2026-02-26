import React, { useEffect, useState } from 'react'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
          credentials: 'include',
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
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order._id} className="border p-3 rounded space-y-1">
          <p><b>Order ID:</b> {order._id}</p>
          <p><b>Total:</b> ₦{order.totalAmount}</p>
          <p><b>User:</b> {order.user?.email || 'N/A'}</p>
          <p>
            <b>Items:</b>{' '}
            {order.items
              .map((i) => i.product?.title)
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      ))}
    </div>
  )
}
