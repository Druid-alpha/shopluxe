import React, { useState } from "react"
import { useSelector } from "react-redux"
import { clearCart, setCart } from "@/features/cart/cartSlice"
import { syncCart, getCart } from "@/features/cart/cartApi"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useLoginMutation } from "@/features/auth/authApi"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch } from "@/app/hooks"
import { setUser, setToken } from "@/features/auth/authSlice"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export default function Login() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const guestCart = useSelector((state) => state.cart.items)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onBlur"
  })

  const [login, { isLoading }] = useLoginMutation()
 
  const onSubmit = async (data) => {
    try {
      const res = await login(data).unwrap()
     dispatch(setUser(res.user))

if (res.accessToken) {
  dispatch(setToken(res.accessToken))
}

// ✅ Merge guest cart
if (guestCart.length > 0) {
  try {
    const mergedCart = await syncCart(guestCart)
    dispatch(setCart(mergedCart))
    dispatch(clearCart())
  } catch (err) {
    console.log("Cart sync failed", err)
  }
} else {
  // If no guest cart, fetch existing DB cart
  const dbCart = await getCart()
  dispatch(setCart(dbCart))
}

toast({ title: "Login successful" })
navigate("/")
    } catch (err) {
      if (err?.data?.message === "email not verified") {
        toast({
          title: "Email not verified",
          description: "Please verify OTP",
        })
        navigate("/verify-email", { state: { email: data.email } })
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 border border-gray-200 rounded-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900 tracking-tight">Welcome back</h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your ShopLuxe account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <Input
                type="email"
                placeholder="Enter your email"
                {...register("email")}
                className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-sm font-medium hover:text-gray-500 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="Enter your password"
                {...register("password")}
                className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign in"}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">New to ShopLuxe?</span>
            </div>
          </div>

          <div className="mt-6">
            <Button
              asChild
              variant="outline"
              className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Link to="/register">Create your account</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
