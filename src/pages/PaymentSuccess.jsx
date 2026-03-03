// src/pages/PaymentSuccess.jsx
import { useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useAppDispatch } from "@/app/hooks"
import { clearCart } from "@/features/cart/cartSlice"
import { useToast } from "@/hooks/use-toast"

export default function PaymentSuccess() {
  const [params] = useSearchParams()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = params.get("reference")
      if (!reference) return

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/payments/verify/${reference}`,
          {
            credentials: "include"
          }
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || "Payment verification failed")

        // Cart already cleared in webhook, clear Redux cart too
        dispatch(clearCart())

        toast({ title: "Payment Successful 🎉", description: "Thank you for your order!" })
        navigate(`/orders/${data.order._id}`) // redirect to order details page
      } catch (err) {
        toast({ title: "Payment Error", description: err.message, variant: "destructive" })
        navigate("/") // fallback
      }
    }

    verifyPayment()
  }, [])
  
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
      <h1 className="text-2xl font-bold">Verifying Payment...</h1>
    </div>
  )
}