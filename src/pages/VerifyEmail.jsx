import React, { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-9 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 border border-gray-200 rounded-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900 tracking-tight">Verify email</h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            To continue, please enter the security code that was sent to <span className="font-semibold text-gray-900">{email}</span>.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5 mt-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Security Code</label>
            <Input
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-center text-lg tracking-widest"
              maxLength={6}
            />
          </div>
          <Button
            type="submit"
            disabled={isVerifying}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 transition-colors"
          >
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify code
          </Button>
        </form>

        <div className="pt-4 flex flex-col items-center justify-center border-t border-gray-200">
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || isResending || resendAttempts >= maxAttempts}
            className="text-sm font-medium text-black hover:underline disabled:text-gray-400 disabled:no-underline"
          >
            {resendAttempts >= maxAttempts
              ? "Resend limit reached"
              : canResend
                ? isResending
                  ? "Sending new code..."
                  : "Resend security code"
                : `Wait ${countdown}s to resend`}
          </button>

          {resendAttempts > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Attempts: {resendAttempts}/{maxAttempts}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
