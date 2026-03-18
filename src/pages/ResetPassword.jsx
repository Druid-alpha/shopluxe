import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

export default function ResetPassword() {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    try {
      if (password.length < 6) {
        toast({ title: 'Password too short', description: 'Use at least 6 characters.', variant: 'destructive' })
        return
      }
      if (password !== confirmPassword) {
        toast({ title: 'Passwords do not match', description: 'Please re-enter both fields.', variant: 'destructive' })
        return
      }
      setIsSubmitting(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Reset failed')

      toast({ title: 'Password reset successfully' })
      window.location.href = '/login'
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const strengthLabel = useMemo(() => {
    if (!password) return 'Enter a strong password'
    if (password.length < 6) return 'Too short'
    if (password.length < 9) return 'Good'
    return 'Strong'
  }, [password])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-[1.05fr_1fr]">
        <div className="hidden lg:flex flex-col justify-between rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-10 text-white shadow-xl">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.35em] text-white/60">ShopLuxe</div>
            <h2 className="mt-4 text-4xl font-black tracking-tight leading-tight font-display">
              Set a new password with confidence.
            </h2>
            <p className="mt-4 text-sm text-white/70 max-w-sm">
              Choose a secure password to keep your account protected. You will be redirected to sign in once complete.
            </p>
            <div className="mt-8 flex items-center gap-3 text-sm text-white/80">
              <ShieldCheck size={16} />
              Passwords are encrypted and never stored in plain text.
            </div>
          </div>
          <div className="text-xs text-white/50">Need help? support@shopluxe.com</div>
        </div>

        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Create new password</h1>
            <p className="mt-2 text-sm text-slate-600">Your new password must be at least 6 characters.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">New Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">{strengthLabel}</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="mt-6 w-full flex justify-center py-2.5 px-4 text-sm font-bold"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save changes & Sign In
          </Button>
        </div>
      </div>
    </div>
  )
}
