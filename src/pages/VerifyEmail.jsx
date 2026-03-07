import { useState, useEffect } from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useVerifyMutation, useResendOtpMutation } from "@/features/auth/authApi"
import { useToast } from "@/hooks/use-toast"

export default function VerifyOtp() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const email = location.state?.email
  const [otp, setOtp] = useState("")
  const [canResend, setCanResend] = useState(true)
  const [countdown, setCountdown] = useState(60)
  const [resendAttempts, setResendAttempts] = useState(0)
  const maxAttempts = 3

  const [verify, { isLoading: isVerifying }] = useVerifyMutation()
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation()

  useEffect(() => {
    if (!email) navigate("/register")
  }, [email, navigate])

  useEffect(() => {
    if (!canResend) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(timer)
            setCanResend(true)
            return 60
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [canResend])

  const handleVerify = async (e) => {
    e.preventDefault()
    try {
      await verify({ email, otp }).unwrap()
      toast({ title: "Email verified", description: "You can now login" })
      navigate("/login")
    } catch (err) {
      toast({
        title: "Verification failed",
        description: err?.data?.message || "Invalid or expired OTP",
        variant: "destructive",
      })
    }
  }

  const handleResend = async () => {
    if (!email) return

    if (resendAttempts >= maxAttempts) {
      toast({
        title: "Resend limit reached",
        description: `You can only resend OTP ${maxAttempts} times`,
        variant: "destructive",
      })
      return
    }

    try {
      await resendOtp({ email }).unwrap()
      toast({ title: "OTP resent successfully" })
      setCanResend(false)
      setResendAttempts((prev) => prev + 1)
    } catch (err) {
      toast({
        title: "Resend failed",
        description: err?.data?.message || "Please try again later",
        variant: "destructive",
      })
    }
  }

  return (
    <section className="min-h-[calc(100vh-130px)] bg-gradient-to-b from-white via-slate-50 to-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Verify your email</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter the 6-digit code sent to <span className="font-semibold text-slate-900">{email}</span>.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Verification code</label>
            <Input
              placeholder="Enter code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="text-center text-lg tracking-[0.35em]"
              maxLength={6}
            />
          </div>

          <Button type="submit" disabled={isVerifying} className="h-11 w-full text-sm font-bold">
            {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Verify code
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-6 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || isResending || resendAttempts >= maxAttempts}
            className="text-sm font-semibold text-slate-900 hover:underline disabled:text-slate-400 disabled:no-underline"
          >
            {resendAttempts >= maxAttempts
              ? "Resend limit reached"
              : canResend
                ? isResending
                  ? "Sending new code..."
                  : "Resend code"
                : `Wait ${countdown}s to resend`}
          </button>

          {resendAttempts > 0 && (
            <p className="mt-2 text-xs text-slate-500">Attempts used: {resendAttempts}/{maxAttempts}</p>
          )}

          <p className="mt-4 text-sm text-slate-600">
            Wrong email?{" "}
            <Link to="/register" className="font-semibold text-slate-900 hover:underline">
              Register again
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
