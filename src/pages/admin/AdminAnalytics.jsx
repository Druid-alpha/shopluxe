import React, { useState, useEffect } from 'react'
import { useAppSelector } from '@/app/hooks'
import { Users, Package, ShoppingBag, TrendingUp, AlertCircle, Loader2 } from 'lucide-react'

export default function AdminAnalytics() {
  const token = useAppSelector(state => state.auth.token)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    revenue: 0
  })

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      try {
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }

        const [usersRes, productsRes, ordersRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/admin/users`, { credentials: 'include', headers }),
          fetch(`${import.meta.env.VITE_API_URL}/products`, { credentials: 'include', headers }),
          fetch(`${import.meta.env.VITE_API_URL}/orders`, { credentials: 'include', headers }),
        ])

        if (!usersRes.ok || !productsRes.ok || !ordersRes.ok) {
          throw new Error('Could not fetch all management data. Please ensure you are logged in as admin.')
        }

        const usersData = await usersRes.json()
        const productsData = await productsRes.json()
        const ordersData = await ordersRes.json()

        const ordersList = ordersData.orders || ordersData || []
        const totalRevenue = ordersList.reduce((sum, order) => sum + (order.totalAmount || 0), 0)

        setStats({
          users: usersData.users?.length || usersData.length || 0,
          products: productsData.total || productsData.products?.length || productsData.length || 0,
          orders: ordersList.length || 0,
          revenue: totalRevenue
        })
      } catch (err) {
        console.error('Failed to load analytics:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [token])

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-100 rounded-lg p-6 flex items-center gap-4 text-red-600">
      <AlertCircle size={24} />
      <p className="font-medium">{error}</p>
    </div>
  )

  const cardData = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Products', value: stats.products, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Revenue', value: `₦${(stats.revenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
      {cardData.map((card, idx) => (
        <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02]">
          <div className={`${card.bg} ${card.color} p-4 rounded-xl`}>
            <card.icon size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
