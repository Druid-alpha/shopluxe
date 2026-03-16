import * as React from 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ShieldCheck, MapPin, ChevronRight, Loader2 } from 'lucide-react'
import { releaseReservation, clearReservationStorage, cancelAllReservations } from '@/lib/reservation'
import { setCart } from '@/features/cart/cartSlice'
import * as cartApi from '@/features/cart/cartApi'
import { productApi } from '@/features/products/productApi'

export default function Checkout() {
  const cart = useAppSelector(state => state.cart.items)
  const token = useAppSelector(state => state.auth.token)
  const dispatch = useAppDispatch()
  const total = cart.reduce((s, item) => s + (item.price || 0) * (item.qty || 1), 0)
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [reservationExpiresAt, setReservationExpiresAt] = React.useState(null)
  const [reservationRemaining, setReservationRemaining] = React.useState(null)
  const [isReleasing, setIsReleasing] = React.useState(false)
  const redirectingRef = React.useRef(false)
  const notifyReservationChange = React.useCallback((expiresAt) => {
    window.dispatchEvent(new CustomEvent('shopluxe:reservation-updated', { detail: { expiresAt } }))
  }, [])
  const clearReservation = React.useCallback(() => {
    void releaseReservation({ token })
    clearReservationStorage()
    setReservationExpiresAt(null)
    setReservationRemaining(null)
  }, [token])
  const setReservation = React.useCallback((expiresAtMs, orderId) => {
    window.localStorage.setItem('shopluxe_reservation', JSON.stringify({
      ...(orderId ? { orderId } : {}),
      expiresAt: expiresAtMs
    }))
    setReservationExpiresAt(expiresAtMs)
    notifyReservationChange(expiresAtMs)
  }, [notifyReservationChange])

  const [address, setAddress] = React.useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
  })

  const handleChange = (e) => {
    const next = { ...address, [e.target.name]: e.target.value }
    setAddress(next)
    window.localStorage.setItem('shopluxe_shipping_address', JSON.stringify(next))
  }

  const isFormValid = address.fullName.trim() && address.phone.trim() && address.address.trim() && address.city.trim() && address.state.trim()

  React.useEffect(() => {
    if (!cart.length) {
      cartApi.getCart()
        .then((data) => dispatch(setCart(data)))
        .catch(() => {})
    }
  }, [cart.length, dispatch])

  React.useEffect(() => {
    const raw = window.localStorage.getItem('shopluxe_shipping_address')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        setAddress(prev => ({ ...prev, ...parsed }))
      }
    } catch {
      // ignore
    }
  }, [])

  React.useEffect(() => {
    const raw = window.localStorage.getItem('shopluxe_reservation')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      const expiresAt = Number(parsed?.expiresAt || 0)
      if (!expiresAt || Number.isNaN(expiresAt)) {
        clearReservationStorage()
        setReservationExpiresAt(null)
        setReservationRemaining(null)
        return
      }
      if (expiresAt <= Date.now()) {
        clearReservationStorage()
        setReservationExpiresAt(null)
        setReservationRemaining(null)
        return
      }
      setReservationExpiresAt(expiresAt)
    } catch {
      clearReservationStorage()
      setReservationExpiresAt(null)
      setReservationRemaining(null)
    }
  }, [clearReservation])

  React.useEffect(() => {
    if (reservationExpiresAt) return
    const syncReservation = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/orders/pending-reservation`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        })
        const data = await res.json()
        if (!res.ok) return
        if (!data?.reservation?.expiresAt || !data?.reservation?.orderId) return
        const expiresAtMs = new Date(data.reservation.expiresAt).getTime()
        if (Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) return
        setReservation(expiresAtMs, data.reservation.orderId)
      } catch {
        // ignore sync errors
      }
    }
    void syncReservation()
  }, [reservationExpiresAt, setReservation, token])

  React.useEffect(() => {
    if (!reservationExpiresAt) return
    const tick = () => {
      const remainingMs = reservationExpiresAt - Date.now()
      if (remainingMs <= 0) {
        clearReservation()
        return
      }
      setReservationRemaining(remainingMs)
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [reservationExpiresAt, clearReservation])

  React.useEffect(() => {
    return () => {
      if (redirectingRef.current) return
      // Keep reservation alive when navigating away from checkout.
      // It should only clear on explicit cancel or expiration.
    }
  }, [])

  const formatRemaining = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    if (minutes <= 0) return `${seconds}s`
    return `${minutes}m ${seconds}s`
  }

  const handleCancelReservation = async () => {
    if (isReleasing) return
    setIsReleasing(true)
    try {
      await cancelAllReservations({ token })
      clearReservationStorage()
      setReservationExpiresAt(null)
      setReservationRemaining(null)
      try {
        const refreshed = await cartApi.getCart()
        dispatch(setCart(refreshed))
      } catch {
        // ignore cart refresh errors
      }
      dispatch(productApi.util.invalidateTags(['Product']))
      toast({ title: 'Reservation cleared' })
    } catch {
      toast({
        title: 'Could not clear reservation',
        description: 'Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsReleasing(false)
    }
  }

  const pay = async () => {
    if (!cart.length) return
    if (!isFormValid) {
      toast({ title: 'Please fill in all shipping details', variant: 'destructive' })
      return
    }
    setLoading(true)

    try {
      const validateRes = await fetch(`${import.meta.env.VITE_API_URL}/orders/validate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      const validateData = await validateRes.json()
      if (!validateRes.ok) {
        const firstIssue = validateData?.items?.[0]
        const extras = []
        if (Number.isFinite(firstIssue?.available)) extras.push(`Available: ${firstIssue.available}`)
        if (Number.isFinite(firstIssue?.reserved)) extras.push(`Reserved: ${firstIssue.reserved}`)
        if (Number.isFinite(firstIssue?.stock)) extras.push(`Stock: ${firstIssue.stock}`)
        const extraText = extras.length ? ` (${extras.join(' | ')})` : ''
        const details = firstIssue?.title
          ? `${firstIssue.title} - ${firstIssue.message}${extraText}`
          : (validateData.message || 'Stock validation failed')
        throw new Error(details)
      }

      // 1. Create order with shipping address
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
      if (!orderRes.ok) {
        if (orderRes.status === 409) {
          try {
            const retryValidate = await fetch(`${import.meta.env.VITE_API_URL}/orders/validate`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              }
            })
            const retryData = await retryValidate.json()
            const firstIssue = retryData?.items?.[0]
            if (firstIssue) {
              const extras = []
              if (Number.isFinite(firstIssue?.available)) extras.push(`Available: ${firstIssue.available}`)
              if (Number.isFinite(firstIssue?.reserved)) extras.push(`Reserved: ${firstIssue.reserved}`)
              if (Number.isFinite(firstIssue?.stock)) extras.push(`Stock: ${firstIssue.stock}`)
              const extraText = extras.length ? ` (${extras.join(' | ')})` : ''
              throw new Error(`${firstIssue.title} - ${firstIssue.message}${extraText}`)
            }
          } catch {
            // fall back to orderData below
          }
        }
        throw new Error(orderData.message)
      }

      // 2. Initialize Paystack transaction
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

      if (payData?.expiresAt) {
        const expiresAtMs = new Date(payData.expiresAt).getTime()
        if (!Number.isNaN(expiresAtMs)) {
          setReservation(expiresAtMs, orderData.order._id)
        }
      }

      toast({
        title: 'Reserved for 10 minutes',
        description: 'Complete payment to secure your items.',
      })

      // 3. Redirect user to Paystack hosted page
      redirectingRef.current = true
      setTimeout(() => {
        window.location.href = payData.authorizationUrl
      }, 400)

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

  const inputCls = "w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-5 py-3.5 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-black transition-all placeholder:text-gray-300"

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-[calc(100vh-80px)] relative">
      {loading && (
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-xl flex items-center gap-3">
            <Loader2 size={20} className="animate-spin text-gray-700" />
            <span className="text-xs font-black uppercase tracking-widest text-gray-500">Processing payment</span>
          </div>
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left: Shipping + Payment */}
        <div className="lg:w-7/12 space-y-6">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <span className="px-3 py-1 rounded-full bg-black text-white">Shipping</span>
            <span className="h-px w-6 bg-gray-200" />
            <span className="px-3 py-1 rounded-full border border-gray-200">Payment</span>
            <span className="h-px w-6 bg-gray-200" />
            <span className="px-3 py-1 rounded-full border border-gray-200">Done</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1 font-display">Secure Checkout</h1>
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

            <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] p-6 rounded-2xl flex items-start gap-4 shadow-xl">
              <ShieldCheck size={24} className="flex-shrink-0 text-blue-400" />
              <p className="leading-loose">Secure Encryption Enabled. Your transaction data is protected with industrial-grade protocols. We do not store sensitive payment information.</p>
            </div>

            <Button
              onClick={pay}
              disabled={loading || !isFormValid}
              className={`w-full h-16 text-xs mt-4 transition-all rounded-none font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 ${isFormValid
                ? 'bg-black hover:bg-slate-800 text-white shadow-2xl scale-105 active:scale-100'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Finalize Payment - ₦{total.toLocaleString()}
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
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 line-clamp-2">{item.title}</p>
                    {(item.variantLabel || typeof item.variant === 'string') && (
                      <p className="text-gray-400 text-xs uppercase mt-0.5">
                        {item.variantLabel || (typeof item.variant === 'string' ? item.variant : '')}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">Qty: {item.qty}</p>
                  </div>
                  <div className="font-semibold text-sm text-gray-900 whitespace-nowrap">
                    ₦{((item.price || 0) * (item.qty || 1)).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {(() => {
              const productMap = new Map()
              cart.forEach(item => {
                const productId = item.productId || item.product?._id || item.product
                if (!productId || productMap.has(productId)) return
                const stock = Number(item.productTotalStock ?? item.productStock ?? 0)
                const reserved = Number(item.productTotalReserved ?? item.productReserved ?? 0)
                productMap.set(productId, { stock, reserved })
              })
              const totals = Array.from(productMap.values())
              const totalAvailable = totals.reduce((sum, p) => sum + Math.max(0, p.stock - p.reserved), 0)
              const totalReserved = totals.reduce((sum, p) => sum + p.reserved, 0)
              if (totalAvailable + totalReserved <= 0) return null
              const pct = Math.min(100, Math.max(0, (totalAvailable / Math.max(1, totalAvailable + totalReserved)) * 100))
              return (
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-amber-700 mb-5">
                  <div className="flex items-center justify-between">
                    <span>{totalAvailable} available</span>
                    <span>{totalReserved} reserved</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-amber-100">
                    <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })()}

            {reservationRemaining && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-5">
                Reservation expires in {formatRemaining(reservationRemaining)}
              </div>
            )}
            {reservationRemaining && (
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 mb-5"
                onClick={handleCancelReservation}
                disabled={isReleasing}
              >
                {isReleasing ? 'Clearing...' : 'Cancel Reservation'}
              </Button>
            )}

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
