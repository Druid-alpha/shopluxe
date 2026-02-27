import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'

export default function ResetPassword() {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const { toast } = useToast()

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Reset failed')

      toast({ title: 'Password reset successfully' })
      window.location.href = '/login'
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 border border-gray-200 rounded-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900 tracking-tight">Create new password</h1>
          <p className="mt-2 text-center text-sm text-gray-600">Please enter your new password below</p>
        </div>
        <div className="space-y-4 mt-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <Input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            />
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 transition-colors"
          >
            Save changes & Sign In
          </Button>
        </div>
      </div>
    </div>
  )
}
