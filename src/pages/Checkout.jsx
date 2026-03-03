import * as React from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { setCart } from '@/features/cart/cartSlice'
import { clearCart } from '@/features/cart/cartSlice'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'

export default function Checkout() {
  const cart = useAppSelector(state => state.cart.items)
  const token = useAppSelector(state => state.auth.token)
  const total = cart.reduce((s, item) => s + item.price * item.qty, 0)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)

  const pay = async () => {
    if (!cart.length) return
    setLoading(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
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

     const pay = async () => {
  if (!cart.length) return
  setLoading(true)

  try {
    // 1️⃣ Create order
    const orderRes = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      credentials: 'include'
    })

    const orderData = await orderRes.json()
    if (!orderRes.ok) throw new Error(orderData.message)

    // 2️⃣ Initialize Paystack transaction
    const payRes = await fetch(`${import.meta.env.VITE_API_URL}/payments/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      credentials: 'include',
      body: JSON.stringify({ orderId: orderData.order._id })
    })

    const payData = await payRes.json()
    if (!payRes.ok) throw new Error(payData.message)

    // 3️⃣ Redirect user to Paystack hosted page
    window.location.href = payData.authorizationUrl

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
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-[calc(100vh-80px)]">

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Verification / Security Block (Left) */}
        <div className="lg:w-7/12 space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Secure Checkout</h1>
            <p className="text-gray-500">Review your order and proceed to payment securely.</p>
          </div>

          <div className="bg-white p-6 md:p-8 border border-gray-200 rounded-xl shadow-sm space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2 text-gray-900">1. Payment Method</h2>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded shadow-sm">
                  {/* Paystack icon placeholder */}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.9687 0C5.35821 0 0 5.35821 0 11.9687C0 18.5791 5.35821 23.9373 11.9687 23.9373C18.5791 23.9373 23.9373 18.5791 23.9373 11.9687C23.9373 5.35821 18.5791 0 11.9687 0ZM11.9687 19.4491C7.83669 19.4491 4.48818 16.1006 4.48818 11.9687C4.48818 7.83669 7.83669 4.48818 11.9687 4.48818C16.1006 4.48818 19.4491 7.83669 19.4491 11.9687C19.4491 16.1006 16.1006 19.4491 11.9687 19.4491ZM10.5186 16.5165H13.6706V14.1206H10.5186V16.5165ZM10.5186 12.3392H13.6706V7.42084H10.5186V12.3392Z" fill="#0BA4DB" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Paystack Secure</p>
                  <p className="text-sm text-gray-500">Cards, Bank Transfer, USSD</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg flex items-start gap-3 mt-4">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              <p>Your payment is processed securely by Paystack. We do not store your credit card details.</p>
            </div>

            <Button
              onClick={pay}
              disabled={loading}
              className="w-full h-14 text-lg mt-6 bg-black hover:bg-gray-800 transition-colors rounded-lg shadow-md"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Confirm and Pay'}
            </Button>
          </div>
        </div>

        {/* Order Summary (Right) */}
        <div className="lg:w-5/12">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
              {cart.map(item => (
                <div key={item.key} className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-50 rounded border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.productImage || item.product?.images?.[0]?.url || 'https://via.placeholder.com/64'}
                      alt={item.title}
                      className="object-contain w-full h-full mix-blend-multiply p-1"
                    />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-gray-900 line-clamp-2">{item.title}</p>
                    {item.variant && <p className="text-gray-500 uppercase text-xs mt-1">{item.variant}</p>}
                    <p className="text-gray-500 mt-1">Qty: {item.qty}</p>
                  </div>
                  <div className="font-medium text-gray-900">
                    ₦{(item.price * item.qty).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">₦{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span className="font-medium text-gray-900">Calculated after payment</span>
              </div>

              <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-3 border-t border-gray-100 mt-3">
                <span>Total to Pay</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
