import React, { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useAppSelector } from '@/app/hooks'

export default function AdminUSers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const token = useAppSelector((state) => state.auth.token)

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
        credentials: 'include', // important!
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
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
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
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

  // Delete User
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to delete user')
      toast({ title: 'User deleted' })
      fetchUsers()
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 italic text-sm text-gray-500">
              <th className="px-6 py-4 font-medium uppercase tracking-wider">User</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="font-semibold text-gray-900">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {user.role !== 'admin' ? (
                    <button
                      className="text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-lg transition-colors border border-green-100"
                      onClick={() => handleRoleChange(user._id, 'admin')}
                    >
                      Promote
                    </button>
                  ) : (
                    <button
                      className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                      onClick={() => handleRoleChange(user._id, 'user')}
                    >
                      Demote
                    </button>
                  )}
                  {user.role !== 'admin' && (
                    <button
                      className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-100 ml-2"
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <div className="p-12 text-center text-gray-500 italic">No users found.</div>
      )}
    </div>
  )
}
