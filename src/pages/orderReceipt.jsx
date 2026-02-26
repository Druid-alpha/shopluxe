import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function OrderReceipt() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/orders/${id}`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => setOrder(data.order))
  }, [id])

  if (!order) return <p>Loading...</p>

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Order Receipt</h1>

      {order.items.map((item, i) => (
        <div key={i} className="flex justify-between">
          <span>{item.product.title} × {item.qty}</span>
          <span>₦{item.priceAtPurchase * item.qty}</span>
        </div>
      ))}

      <div className="flex justify-between font-bold text-xl">
        <span>Total</span>
        <span>₦{order.totalAmount}</span>
      </div>
    </div>
  )
}
