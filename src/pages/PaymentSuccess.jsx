import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useAppDispatch } from "@/app/hooks"
import { clearCart } from "@/features/cart/cartSlice"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, XCircle, Loader2, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PaymentSuccess() {
  const [params] = useSearchParams()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [status, setStatus] = useState("verifying") // verifying | success | error
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = params.get("reference")
      if (!reference) {
        setStatus("error")
        setErrorMsg("No payment reference found. Please contact support.")
        return
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/payments/verify/${reference}`,
          { credentials: "include" }
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || "Payment verification failed")

        dispatch(clearCart())
        setStatus("success")

        setTimeout(() => {
          navigate(`/orders/${data.order._id}`)
        }, 2000)

      } catch (err) {
        setErrorMsg(err.message || "Payment verification failed")
        setStatus("error")
      }
    }

    verifyPayment()
  }, [])

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full">

        {/* VERIFYING State */}
        {status === "verifying" && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 text-center space-y-6 animate-fade-in">
            <div className="flex justify-center">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-blue-50 animate-ping opacity-60" />
                <div className="relative w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <Loader2 size={36} className="animate-spin text-blue-500" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Verifying Payment</h1>
              <p className="text-gray-500 text-sm mt-2">Please wait while we confirm your payment with Paystack…</p>
            </div>
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* SUCCESS State */}
        {status === "success" && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-scale-in">
                <CheckCircle2 size={42} className="text-green-500" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment Confirmed!</h1>
              <p className="text-gray-500 text-sm mt-2">Redirecting you to your order receipt…</p>
            </div>
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-green-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ERROR State */}
        {status === "error" && (
          <div className="bg-white rounded-3xl shadow-lg border border-red-100 p-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle size={42} className="text-red-500" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Verification Failed</h1>
              <p className="text-red-500 text-sm mt-2">{errorMsg}</p>
              <p className="text-gray-400 text-xs mt-1">If you were charged, please contact support with your reference number.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/")} className="bg-black text-white hover:bg-gray-800 rounded-xl h-12">
                <ShoppingBag size={18} className="mr-2" />
                Back to Shop
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="rounded-xl h-12 border-gray-200"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}