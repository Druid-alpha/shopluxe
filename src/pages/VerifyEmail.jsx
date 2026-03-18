import { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ShieldCheck, Mail } from "lucide-react"
import { useVerifyMutation, useResendOtpMutation } from "@/features/auth/authApi"
import { useToast } from "@/hooks/use-toast"

export default function VerifyOtp() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const email = location.state?.email
  const OTP_LENGTH = 6
  const [otpDigits, setOtpDigits] = useState(Array.from({ length: OTP_LENGTH }, () => ""))
  const [canResend, setCanResend] = useState(true)
  const [countdown, setCountdown] = useState(60)
  const [resendAttempts, setResendAttempts] = useState(0)
  const maxAttempts = 3
  const inputRefs = useRef([])

  const [verify, { isLoading: isVerifying }] = useVerifyMutation()
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation()

  useEffect(() => {
    if (!email) navigate("/register")
  }, [email, navigate])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

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

  const applyOtpDigits = (nextDigits, nextIndex) => {
    setOtpDigits(nextDigits)
    if (nextIndex >= OTP_LENGTH) {
      inputRefs.current[OTP_LENGTH - 1]?.blur()
    } else {
      inputRefs.current[nextIndex]?.focus()
    }
  }

  const handleChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "")
    if (!cleaned) {
      const next = [...otpDigits]
      next[index] = ""
      setOtpDigits(next)
      return
    }
    const chars = cleaned.split("")
    const next = [...otpDigits]
    let cursor = index
    chars.forEach((char) => {
      if (cursor < OTP_LENGTH) {
        next[cursor] = char
        cursor += 1
      }
    })
    applyOtpDigits(next, cursor)
  }

  const handleKeyDown = (index, event) => {
    if (event.key !== "Backspace") return
    if (otpDigits[index]) return
    if (index > 0) {
      const next = [...otpDigits]
      next[index - 1] = ""
      setOtpDigits(next)
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData("text")
    if (!pasted) return
    event.preventDefault()
    const cleaned = pasted.replace(/\D/g, "").slice(0, OTP_LENGTH)
    if (!cleaned) return
    const next = Array.from({ length: OTP_LENGTH }, (_, idx) => cleaned[idx] || "")
    applyOtpDigits(next, cleaned.length)
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    const otp = otpDigits.join("")
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
      const res = await resendOtp({ email }).unwrap()
      toast({ title: "OTP resent successfully" })
      setCanResend(false)
      setResendAttempts((prev) => prev + 1)
      const waitSeconds = Number(res?.retryAfterSeconds || 60)
      setCountdown(waitSeconds)
    } catch (err) {
      const waitSeconds = Number(err?.data?.retryAfterSeconds || 60)
      setCountdown(waitSeconds)
      setCanResend(false)
      toast({
        title: "Resend failed",
        description: err?.data?.message || "Please try again later",
        variant: "destructive",
      })
    }
  }

  return (
    <section className="min-h-[calc(100vh-130px)] bg-gradient-to-b from-white via-slate-50 to-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="hidden lg:flex flex-col justify-between rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-10 text-white shadow-xl">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.35em] text-white/60">ShopLuxe</div>
            <h2 className="mt-4 text-4xl font-black tracking-tight leading-tight font-display">
              Secure your account in seconds.
            </h2>
            <p className="mt-4 text-sm text-white/70 max-w-sm">
              We sent a one-time code to keep your account protected. Enter it below to finish signing up.
            </p>
            <div className="mt-8 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <ShieldCheck size={16} />
                <span className="text-white/80">OTP expires in 10 minutes</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} />
                <span className="text-white/80">Sent to {email}</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-white/50">Need help? support@shopluxe.com</div>
        </div>

        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Verify your email</h1>
            <p className="mt-2 text-sm text-slate-600">
              Enter the 6-digit code sent to <span className="font-semibold text-slate-900">{email}</span>.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                Verification code
              </label>
              <div className="grid grid-cols-6 gap-2" onPaste={handlePaste}>
                {otpDigits.map((digit, index) => (
                  <Input
                    key={`otp-${index}`}
                    ref={(el) => (inputRefs.current[index] = el)}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    inputMode="numeric"
                    maxLength={1}
                    className="h-12 text-center text-lg font-bold tracking-[0.15em] border-slate-200 focus-visible:ring-black"
                    required
                  />
                ))}
              </div>
            </div>

            <Button type="submit" disabled={isVerifying || otpDigits.join("").length < OTP_LENGTH} className="h-11 w-full text-sm font-bold">
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
      </div>
    </section>
  )
}
