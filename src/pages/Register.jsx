import { useEffect, useRef, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { useRegisterMutation } from "@/features/auth/authApi"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    avatar: z.any().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export default function Register() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const passwordTimerRef = useRef(null)
  const confirmTimerRef = useRef(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  })

  const [registerApi, { isLoading }] = useRegisterMutation()

  useEffect(() => {
    return () => {
      if (passwordTimerRef.current) clearTimeout(passwordTimerRef.current)
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current)
    }
  }, [])

  const startAutoHide = (ref, setter) => {
    if (ref.current) clearTimeout(ref.current)
    ref.current = setTimeout(() => setter(false), 2000)
  }

  const handleTogglePassword = () => {
    setShowPassword((prev) => {
      const next = !prev
      if (next) {
        startAutoHide(passwordTimerRef, setShowPassword)
      } else if (passwordTimerRef.current) {
        clearTimeout(passwordTimerRef.current)
      }
      return next
    })
  }

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword((prev) => {
      const next = !prev
      if (next) {
        startAutoHide(confirmTimerRef, setShowConfirmPassword)
      } else if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current)
      }
      return next
    })
  }

  const onSubmit = async (data) => {
    const formData = new FormData()
    formData.append("name", data.name)
    formData.append("email", data.email)
    formData.append("password", data.password)
    formData.append("confirmPassword", data.confirmPassword)
    if (data.avatar?.[0]) {
      formData.append("avatar", data.avatar[0])
    }

    try {
      await registerApi(formData).unwrap()
      toast({ title: "Registration successful" })
      navigate("/verify-email", { state: { email: data.email } })
    } catch (err) {
      toast({
        title: "Registration failed",
        description: err?.data?.message || "Something went wrong",
        variant: "destructive",
      })
    }
  }

  return (
    <section className="min-h-[calc(100vh-130px)] bg-gradient-to-b from-white via-slate-50 to-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Create your account</h1>
          <p className="mt-2 text-sm text-slate-600">Join ShopLuxe to save favorites and manage orders easily.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Full name</label>
            <Input
              placeholder="First and last name"
              {...register("name")}
              className={errors.name ? "border-red-500 focus-visible:ring-red-400" : ""}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

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
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
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

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Confirm password</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repeat password"
                {...register("confirmPassword")}
                className={`pr-10 ${errors.confirmPassword ? "border-red-500 focus-visible:ring-red-400" : ""}`}
              />
              <button
                type="button"
                onClick={handleToggleConfirmPassword}
                className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Profile image (optional)</label>
            <Input
              type="file"
              accept="image/*"
              {...register("avatar")}
              className="file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
            />
          </div>

          <Button disabled={isLoading} className="h-11 w-full text-sm font-bold">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create account"}
          </Button>
        </form>

        <div className="mt-8 border-t border-slate-200 pt-6 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-slate-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
