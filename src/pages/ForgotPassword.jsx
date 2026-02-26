import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import React, { useState } from 'react'

export default function ForgotPassword() {
  const [email, setEmail]=useState('')
  const {toast}= useToast()

  const handleSubmit = async()=>{
    try {
      const res= await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`,{
        method:'POST',
        headers:{'Content-Type':"application/json"},
        body:JSON.stringify({email})
      })
      const data = await res.json()
      if (!res.ok)throw new Error (data.message)
        toast({title:'Reset email sent'})
    } catch (error) {
      toast({title:'Error',description:error.message, variant:'destructive'})
    }
  }
  return (
    <div className='max-w-md mx-auto p-6 space-y-4'>
  <h1 className='text-xl font-bold'>Forgot Password</h1>
  <Input placeholder='Email' value={email} onChange={(e)=>setEmail(e.target.value)}/>
  <Button onClick={handleSubmit}>send Reset Email</Button>
    </div>
  )
}
