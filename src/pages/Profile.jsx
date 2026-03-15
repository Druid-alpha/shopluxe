import React, { useState, useEffect, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { setUser } from '@/features/auth/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Camera, User, Loader2, CheckCircle2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Link } from 'react-router-dom'

export default function Profile() {
  const { user, token } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const fileInputRef = useRef(null)

  const [name, setName] = useState(user?.name || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  // Keep local name in sync if Redux user changes (e.g. from elsewhere)
  useEffect(() => {
    if (user?.name) setName(user.name)
  }, [user?.name])

  // Handle image preview
  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(avatarFile)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [avatarFile])

  const handleUpdate = async () => {
    if (!name.trim()) return toast({ title: 'Name is required', variant: 'destructive' })
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('name', name)
      if (avatarFile) formData.append('avatar', avatarFile)

      const endpoint = avatarFile ? `/users/me/avatar` : `/users/me`

      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'PUT',
        credentials: 'include',
        body: avatarFile ? formData : JSON.stringify({ name }),
        headers: {
          ...(avatarFile ? {} : { 'Content-Type': 'application/json' }),
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Update failed')

      dispatch(setUser(data.user))
      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved successfully.',
      })
      setAvatarFile(null)
    } catch (err) {
      toast({ title: 'Update Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-gray-900 to-gray-800" />

        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-8 flex flex-col items-center sm:items-start sm:flex-row sm:gap-6">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg bg-gray-50">
                <AvatarImage src={previewUrl || user?.avatar} className="object-cover" />
                <AvatarFallback className="text-3xl font-bold bg-gray-100 text-gray-400">
                  {user?.name?.[0]?.toUpperCase() || <User size={40} />}
                </AvatarFallback>
              </Avatar>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-white"
              >
                <Camera size={24} />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files[0])}
              />
            </div>

            <div className="mt-4 sm:mt-20 text-center sm:text-left flex-1">
              <h1 className="text-2xl font-black text-gray-900">{user?.name}</h1>
              <p className="text-gray-500 text-sm font-medium">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
              <Input
                placeholder="How should we call you?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all text-base font-medium"
              />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleUpdate}
                disabled={loading}
                className="h-12 px-8 rounded-xl bg-black hover:bg-gray-800 text-white font-bold transition-all shadow-lg flex-1 sm:flex-none"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-5 w-5" /> Save Changes</>
                )}
              </Button>

              {avatarFile && (
                <Button
                  variant="ghost"
                  onClick={() => setAvatarFile(null)}
                  className="h-12 text-gray-400 hover:text-red-500"
                >
                  Discard Changes
                </Button>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <Button asChild variant="outline" className="h-12 rounded-xl w-full sm:w-auto">
                <Link to="/orders">Track My Orders</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8 font-medium">
        ShopLuxe. Verified Secure Account
      </p>
    </div>
  )
}
