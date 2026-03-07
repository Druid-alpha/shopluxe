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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  })

  const [login, { isLoading }] = useLoginMutation()

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
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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
            <Input
              type="password"
              placeholder="Enter your password"
              {...register("password")}
              className={errors.password ? "border-red-500 focus-visible:ring-red-400" : ""}
            />
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
    </section>
  )
}
