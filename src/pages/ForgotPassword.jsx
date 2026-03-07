import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    try {
      setIsSending(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast({
        title: "Reset link sent",
        description: "Check your email for password reset instructions.",
      })
    } catch (error) {
      toast({
        title: "Request failed",
        description: error.message || "Unable to send reset link",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="min-h-[calc(100vh-130px)] bg-gradient-to-b from-white via-slate-50 to-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Forgot your password?</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your account email and we will send a secure reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Email address</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={isSending} className="h-11 w-full text-sm font-bold">
            {isSending ? "Sending..." : "Send reset link"}
          </Button>
        </form>

        <div className="mt-8 border-t border-slate-200 pt-6 text-center">
          <p className="text-sm text-slate-600">
            Remember your password?{" "}
            <Link to="/login" className="font-semibold text-slate-900 hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
