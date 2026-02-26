import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useLoginMutation } from "@/features/auth/authApi"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch } from "@/app/hooks"
import { setUser } from "@/features/auth/authSlice"

export default function Login() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [login, { isLoading }] = useLoginMutation()

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const res = await login({ email, password }).unwrap()

      // ✅ FIX: PASS USER DIRECTLY (NO EXTRA OBJECT)
      dispatch(setUser(res.user))

      toast({ title: "Login successful" })
      navigate("/")
    } catch (err) {
      if (err?.data?.message === "email not verified") {
        toast({
          title: "Email not verified",
          description: "Please verify OTP",
        })
        navigate("/verify-email", { state: { email } })
        return
      }

      toast({
        title: "Login failed",
        description: err?.data?.message || "Invalid credentials",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded space-y-4">
      <h1 className="text-2xl font-bold text-center">Login</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Login
        </Button>
      </form>

      <div className="text-center mt-2">
        <Link to="/forgot-password" className="text-primary underline text-sm">
          Forgot password?
        </Link>
      </div>
    </div>
  )
}
