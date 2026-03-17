import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { clearCart, setCart } from "@/features/cart/cartSlice"
import { syncCart, getCart } from "@/features/cart/cartApi"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Loader2 } from "lucide-react"
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
  const [showPassword, setShowPassword] = useState(false)
  const passwordTimerRef = useRef(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  })

  const [login, { isLoading }] = useLoginMutation()

  useEffect(() => {
    return () => {
      if (passwordTimerRef.current) clearTimeout(passwordTimerRef.current)
    }
  }, [])

  const handleTogglePassword = () => {
    setShowPassword((prev) => {
      const next = !prev
      if (next) {
        if (passwordTimerRef.current) clearTimeout(passwordTimerRef.current)
        passwordTimerRef.current = setTimeout(() => setShowPassword(false), 2000)
      } else if (passwordTimerRef.current) {
        clearTimeout(passwordTimerRef.current)
      }
      return next
    })
  }

  const onSubmit = async (data) => {
    try {
      const res = await login(data).unwrap()
      dispatch(setUser(res.user))

      if (res.accessToken) {
        dispatch(setToken(res.accessToken))
      }

      if (guestCart.length > 0) {
        try {
          const mergedCart = await syncCart(guestCart)
          dispatch(setCart(mergedCart))
          dispatch(clearCart())
        } catch (err) {
          console.log("Cart sync failed", err)
        }
      } else {
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
    <section className="min-h-[calc(100vh-130px)] bg-gradient-to-b from-white via-slate-50 to-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="hidden lg:flex flex-col justify-between rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-10 shadow-xl">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.35em] text-white/60">ShopLuxe</div>
            <h2 className="mt-4 text-4xl font-black tracking-tight leading-tight font-display">
              A premium shopping experience built for speed and trust.
            </h2>
            <p className="mt-4 text-sm text-white/70 max-w-md">
              Sign in to manage orders, save favorites, and enjoy a seamless checkout every time.
            </p>
            <div className="mt-8 space-y-3 text-sm">
              {[
                'Fast checkout + secure payments',
                'Track shipments in real time',
                'Save items to your wishlist',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-white/80" />
                  <span className="text-white/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-white/50">Need help? support@shopluxe.com</div>
        </div>

        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Sign in to ShopLuxe</h1>
            <p className="mt-2 text-sm text-slate-600">Access your orders, wishlist, and checkout securely.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Email address</label>
            <Input
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              className={errors.email ? "border-red-500 focus-visible:ring-red-400" : ""}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-800">Password</label>
              <Link to="/forgot-password" className="text-xs font-semibold text-slate-600 hover:text-black">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password")}
                className={`pr-10 ${errors.password ? "border-red-500 focus-visible:ring-red-400" : ""}`}
              />
              <button
                type="button"
                onClick={handleTogglePassword}
                className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <Button type="submit" disabled={isLoading} className="h-11 w-full text-sm font-bold">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign in"}
          </Button>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6 text-center">
            <p className="text-sm text-slate-600">
              New to ShopLuxe?{" "}
              <Link to="/register" className="font-semibold text-slate-900 hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
