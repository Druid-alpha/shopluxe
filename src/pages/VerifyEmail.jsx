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
    <div className="max-w-md mx-auto mt-10 p-6 border rounded space-y-4">
      <h1 className="text-2xl font-bold text-center">Verify OTP</h1>
      <p className="text-sm text-muted-foreground text-center">
        Enter the code sent to <b>{email}</b>
      </p>

      <form onSubmit={handleVerify} className="space-y-3">
        <Input
          placeholder="OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <Button
          type="submit"
          disabled={isVerifying}
          className="w-full flex items-center justify-center"
        >
          {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify
        </Button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        disabled={!canResend || isResending || resendAttempts >= maxAttempts}
        className="text-sm text-primary underline disabled:opacity-50"
      >
        {resendAttempts >= maxAttempts
          ? "Resend limit reached"
          : canResend
          ? isResending
            ? "Sending..."
            : "Resend OTP"
          : `Resend in ${countdown}s`}
      </button>

      {resendAttempts > 0 && (
        <p className="text-xs text-muted-foreground">
          Attempts: {resendAttempts}/{maxAttempts}
        </p>
      )}
    </div>
  )
}
