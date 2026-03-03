import * as React from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, MapPin, User, Phone, ChevronRight, Loader2 } from 'lucide-react'

export default function Checkout() {
  const cart = useAppSelector(state => state.cart.items)
  const token = useAppSelector(state => state.auth.token)
  const total = cart.reduce((s, item) => s + (item.price || 0) * (item.qty || 1), 0)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)

  const [address, setAddress] = React.useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
  })

  const handleChange = (e) => {
    setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const isFormValid = address.fullName.trim() && address.phone.trim() && address.address.trim() && address.city.trim() && address.state.trim()

  const pay = async () => {
    if (!cart.length) return
    if (!isFormValid) {
      toast({ title: 'Please fill in all shipping details', variant: 'destructive' })
      return
    }
    setLoading(true)

    try {
      // 1️⃣ Create order with shipping address
      const orderRes = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ shippingAddress: address })
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.message)

      // 2️⃣ Initialize Paystack transaction
      const payRes = await fetch(`${import.meta.env.VITE_API_URL}/payments/paystack/init`, {
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

  const inputCls = "w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-all placeholder:text-gray-400 bg-white"

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-[calc(100vh-80px)]">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left: Shipping + Payment */}
        <div className="lg:w-7/12 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Secure Checkout</h1>
            <p className="text-gray-500 text-sm">Fill in your shipping details and proceed to payment.</p>
          </div>

          {/* Shipping Address Form */}
          <div className="bg-white p-6 md:p-8 border border-gray-200 rounded-xl shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b pb-4">
              <MapPin size={18} className="text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">1. Shipping Address</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Full Name *</label>
                <input
                  name="fullName"
                  value={address.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Phone Number *</label>
                <input
                  name="phone"
                  value={address.phone}
                  onChange={handleChange}
                  placeholder="08012345678"
                  type="tel"
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Street Address *</label>
                <input
                  name="address"
                  value={address.address}
                  onChange={handleChange}
                  placeholder="12 Abiodun Street, Ikeja"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">City *</label>
                <input
                  name="city"
                  value={address.city}
                  onChange={handleChange}
                  placeholder="Lagos"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">State *</label>
                <input
                  name="state"
                  value={address.state}
                  onChange={handleChange}
                  placeholder="Lagos State"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white p-6 md:p-8 border border-gray-200 rounded-xl shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b pb-4">
              <ShieldCheck size={18} className="text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">2. Payment Method</h2>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3">
              <div className="bg-white p-2 rounded shadow-sm flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.9687 0C5.35821 0 0 5.35821 0 11.9687C0 18.5791 5.35821 23.9373 11.9687 23.9373C18.5791 23.9373 23.9373 18.5791 23.9373 11.9687C23.9373 5.35821 18.5791 0 11.9687 0ZM11.9687 19.4491C7.83669 19.4491 4.48818 16.1006 4.48818 11.9687C4.48818 7.83669 7.83669 4.48818 11.9687 4.48818C16.1006 4.48818 19.4491 7.83669 19.4491 11.9687C19.4491 16.1006 16.1006 19.4491 11.9687 19.4491Z" fill="#0BA4DB" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Paystack Secure</p>
                <p className="text-xs text-gray-500">Cards, Bank Transfer, USSD</p>
              </div>
            </div>

            <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg flex items-start gap-3">
              <ShieldCheck size={18} className="flex-shrink-0 mt-0.5 text-blue-600" />
              <p>Your payment is processed securely by Paystack. We do not store your card details.</p>
            </div>

            <Button
              onClick={pay}
              disabled={loading || !isFormValid}
              className={`w-full h-14 text-base mt-2 transition-all rounded-xl shadow-md font-bold flex items-center justify-center gap-2 ${isFormValid
                  ? 'bg-black hover:bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm & Pay ₦{total.toLocaleString()}
                  <ChevronRight size={18} />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:w-5/12">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Order Summary</h2>

            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1 mb-5">
              {cart.map(item => (
                <div key={item.key} className="flex gap-3 items-start">
                  <div className="w-14 h-14 bg-gray-50 rounded-lg border border-gray-100 flex-shrink-0 overflow-hidden p-1">
                    <img
                      src={item.productImage || 'https://via.placeholder.com/56'}
                      alt={item.title}
                      className="object-contain w-full h-full mix-blend-multiply"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 line-clamp-2">{item.title}</p>
                    {item.variant && <p className="text-gray-400 text-xs uppercase mt-0.5">{item.variant}</p>}
                    <p className="text-gray-500 text-xs mt-1">Qty: {item.qty}</p>
                  </div>
                  <div className="font-semibold text-sm text-gray-900 whitespace-nowrap">
                    ₦{((item.price || 0) * (item.qty || 1)).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">₦{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Shipping</span>
                <span className="font-medium text-gray-900">Calculated after payment</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-3 border-t border-gray-100">
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
