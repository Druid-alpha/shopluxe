import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'

const POLLING_INTERVAL = 15000

const formatDate = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString()
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const { toast } = useToast()
  const token = useAppSelector((state) => state.auth.token)

  // Fetch users
  const fetchUsers = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users?sortBy=created-1&sort=created-1`, {
        credentials: 'include', // important!
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to fetch users')
      const sortedUsers = [...(data.users || [])].sort((a, b) => (
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ))
      setUsers(sortedUsers)
      setLastUpdated(new Date().toLocaleString())
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      if (silent) setRefreshing(false)
      else setLoading(false)
    }
  }, [token, toast])

  useEffect(() => {
    fetchUsers()
    const timer = setInterval(() => {
      fetchUsers(true)
    }, POLLING_INTERVAL)

    return () => clearInterval(timer)
  }, [fetchUsers])

  const usersWithMetadata = useMemo(
    () => users.map((user) => ({
      ...user,
      lastSignedIn: user.lastSignedIn || user.lastLogin || user.lastSeen || null,
      dateJoined: user.createdAt || user.joinedAt || null,
    })),
    [users]
  )

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
      fetchUsers(true)
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
      fetchUsers(true)
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
            Last updated: {lastUpdated || 'Just now'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchUsers(true)}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCcw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto max-h-[70vh] relative">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="border-b border-gray-100 text-xs text-gray-500 font-bold uppercase tracking-widest">
              <th className="px-6 py-4 font-medium uppercase tracking-wider">User</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Last Signed In</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Date Joined</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {usersWithMetadata.map((user) => (
              <tr key={user._id} className="h-16 hover:bg-gray-50/60 transition-colors">
                <td className="px-6 py-4 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="font-semibold text-gray-900">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm align-middle">{user.email}</td>
                <td className="px-6 py-4 text-gray-600 text-sm align-middle">{formatDate(user.lastSignedIn)}</td>
                <td className="px-6 py-4 text-gray-600 text-sm align-middle">{formatDate(user.dateJoined)}</td>
                <td className="px-6 py-4 align-middle">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right align-middle">
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
        <div className="p-12 text-center text-gray-500">
          <p className="text-sm font-semibold">No users found.</p>
          <div className="mt-4 flex items-center justify-center">
            <Button variant="outline" className="rounded-xl" onClick={() => fetchUsers(true)}>Refresh</Button>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
