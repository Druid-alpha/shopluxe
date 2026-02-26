import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { clearCart } from '@/features/cart/cartSlice'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Checkout() {
  const cart = useAppSelector(state => state.cart.items)
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const pay = async () => {
    if (!cart.length) return
    setLoading(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      // 🔍 DEBUG — remove later
      console.log({
        key: import.meta.env.VITE_PAYSTACK_PUBLICKEY,
        email: data.userEmail,
        amount: Math.round(total * 100)
      })

      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLICKEY, // MUST be pk_
        email: data.userEmail || 'customer@example.com',
        amount: Math.round(total * 100), // ✅ INTEGER ONLY
        currency: 'NGN',
        ref: `${data.order._id}-${Date.now()}`,
        callback: () => {
          dispatch(clearCart())
          toast({ title: 'Payment successful' })
          navigate(`/orders/${data.order._id}`)
        },
        onclose: () => toast({ title: 'Payment cancelled' })
      })

      handler.openIframe()
    } catch (e) {
      toast({
        title: 'Payment error',
        description: e.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Checkout</h1>

      {cart.map(item => (
        <div key={item.key} className="flex justify-between border p-2 rounded">
          <span>{item.title} × {item.qty}</span>
          <span>₦{item.price * item.qty}</span>
        </div>
      ))}

      <div className="flex justify-between font-bold text-lg">
        <span>Total</span>
        <span>₦{total}</span>
      </div>

      <Button onClick={pay} disabled={loading}>
        {loading ? 'Processing...' : 'Pay with Paystack'}
      </Button>
    </div>
  )
}
