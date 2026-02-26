import React, { useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { setUser } from '@/features/auth/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

export default function Profile() {
  const { user } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const { toast } = useToast()

  const [name, setName] = useState(user?.name || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [loading, setLoading] = useState(false)

 const handleUpdate = async () => {
  if (!name) return toast({ title: 'Name is required', variant: 'destructive' })
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
      headers: avatarFile ? {} : { 'Content-Type': 'application/json' },
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Update failed')

    // ✅ IMPORTANT FIX
    dispatch(setUser(data.user))

    toast({ title: 'Profile updated successfully' })
    setAvatarFile(null)
  } catch (err) {
    toast({ title: 'Error', description: err.message, variant: 'destructive' })
  } finally {
    setLoading(false)
  }
}


  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="flex flex-col">
        <label className="mb-1 font-medium">Avatar</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAvatarFile(e.target.files[0])}
        />
      </div>

      {avatarFile && (
        <div className="mt-2">
          <p className="text-sm">Selected file: {avatarFile.name}</p>
        </div>
      )}

      <Button onClick={handleUpdate} disabled={loading}>
        {loading ? 'Updating...' : 'Update Profile'}
      </Button>
    </div>
  )
}
