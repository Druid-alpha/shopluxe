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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 border border-gray-200 rounded-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900 tracking-tight">Create Account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
            <Input
              placeholder="First and last name"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              placeholder="Email address"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input
              type="password"
              placeholder="At least 6 characters"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Avatar (Optional)</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm({ ...form, avatar: e.target.files[0] })
              }
              className="appearance-none block w-full px-3 text-gray-500 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
            />
          </div>

          <Button
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 transition-colors"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify email"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-black hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}