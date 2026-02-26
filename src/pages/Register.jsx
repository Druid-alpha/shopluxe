import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useRegisterMutation } from "@/features/auth/authApi"
import { useToast } from "@/hooks/use-toast"

export default function Register() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    avatar: null,
  })

  const [register, { isLoading }] = useRegisterMutation()

  const handleSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append("name", form.name)
    formData.append("email", form.email)
    formData.append("password", form.password)
    if (form.avatar) formData.append("avatar", form.avatar)

    try {
      await register(formData).unwrap()
      toast({ title: "Registration successful" })
      navigate("/verify-email", { state: { email: form.email } })
    } catch (err) {
      toast({
        title: "Registration failed",
        description: err?.data?.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6 border rounded-lg space-y-4">
      <h1 className="text-2xl font-bold text-center">Create Account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Full name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          type="email"
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <Input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setForm({ ...form, avatar: e.target.files[0] })
          }
        />

        <Button disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Register
        </Button>
      </form>
    </div>
  )
}