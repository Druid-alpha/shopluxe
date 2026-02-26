import React, { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

export default function AdminUSers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
        credentials: 'include', // important!
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to fetch users')
      setUsers(data.users)
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Promote / Demote
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to update role')
      toast({ title: `User role updated to ${newRole}` })
      fetchUsers()
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  if (loading) return <p>Loading users...</p>

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <div key={user._id} className="border p-2 rounded flex justify-between items-center">
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-sm">Role: {user.role}</p>
          </div>
          <div className="flex gap-2">
            {user.role !== 'admin' && (
              <button
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={() => handleRoleChange(user._id, 'admin')}
              >
                Promote to Admin
              </button>
            )}
            {user.role === 'admin' && (
              <button
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => handleRoleChange(user._id, 'user')}
              >
                Demote to User
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
