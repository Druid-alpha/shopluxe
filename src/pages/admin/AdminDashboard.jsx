import { Button } from '@/components/ui/button'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import AdminProducts from './AdminProducts'
import AdminUsers from './AdminUsers'
import AdminOrders from './AdminOrders'
import AdminAnalytics from './AdminAnalytics'
import AdminReviews from './AdminReviews'
import { LayoutDashboard, Package, ShoppingBag, Users, MessageSquare } from 'lucide-react'
import { useGetAllOrdersQuery } from '@/features/orders/orderApi'
import { useAppSelector } from '@/app/hooks'
import { useToast } from '@/hooks/use-toast'

export default function AdminDashboard() {
  const [tab, setTab] = useState('products')
  const { toast } = useToast()
  const token = useAppSelector((state) => state.auth.token)
  const [newUsersCount, setNewUsersCount] = useState(0)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const lastSeenUsersKey = 'shopluxe_admin_last_seen_users'
  const lastSeenOrdersKey = 'shopluxe_admin_last_seen_orders'
  const { data } = useGetAllOrdersQuery(undefined, {
    pollingInterval: 15000,
    refetchOnFocus: true,
    refetchOnReconnect: true
  })
  const orders = data?.orders || []
  const returnRequestCount = orders.filter(o => o?.returnStatus === 'requested').length
  const getLastSeen = (key) => {
    const value = localStorage.getItem(key)
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  const setLastSeen = (key, date) => {
    if (!date) return
    localStorage.setItem(key, new Date(date).toISOString())
  }

  const playNotificationSound = useCallback((frequency = 880) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequency
      gain.gain.value = 0.05
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
      osc.onended = () => ctx.close()
    } catch (err) {
      // Audio might be blocked; ignore.
    }
  }, [])

  const fetchUsersForNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users?sortBy=created-1&sort=created-1`, {
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to fetch users')
      const users = Array.isArray(data.users) ? data.users : []
      const lastSeen = getLastSeen(lastSeenUsersKey)
      if (!lastSeen) {
        const latest = users[0]?.createdAt || new Date()
        setLastSeen(lastSeenUsersKey, latest)
        setNewUsersCount(0)
        return
      }
      const newUsers = users.filter(u => {
        const createdAt = u?.createdAt ? new Date(u.createdAt) : null
        return createdAt && createdAt > lastSeen
      })
      const count = newUsers.length
      setNewUsersCount(count)
      if (count > 0) {
        toast({
          title: 'New user registered',
          description: `${count} new user${count > 1 ? 's' : ''} joined.`
        })
        playNotificationSound(740)
      }
    } catch (err) {
      // Silent fail to avoid noisy UI; admin can refresh manually.
    }
  }, [playNotificationSound, toast, token])

  useEffect(() => {
    fetchUsersForNotifications()
    const timer = setInterval(fetchUsersForNotifications, 15000)
    return () => clearInterval(timer)
  }, [fetchUsersForNotifications])

  useEffect(() => {
    const lastSeen = getLastSeen(lastSeenOrdersKey)
    if (!lastSeen) {
      const latestOrder = orders[0]?.createdAt || new Date()
      setLastSeen(lastSeenOrdersKey, latestOrder)
      setNewOrdersCount(0)
      return
    }
    const count = orders.filter(o => {
      const createdAt = o?.createdAt ? new Date(o.createdAt) : null
      return createdAt && createdAt > lastSeen
    }).length
    setNewOrdersCount(count)
  }, [orders])

  const handleTabChange = (id) => {
    setTab(id)
    if (id === 'users') {
      setNewUsersCount(0)
      setLastSeen(lastSeenUsersKey, new Date())
    }
    if (id === 'orders') {
      setNewOrdersCount(0)
      setLastSeen(lastSeenOrdersKey, new Date())
    }
  }

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h1 className='text-2xl font-black tracking-tighter uppercase font-display'>Admin Dashboard</h1>
        <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mt-1'>Manage products, orders, and customers</p>
      </div>
      <div className='flex flex-wrap gap-2 mb-8 bg-gray-50 p-2 rounded-2xl w-fit'>
        {[
          { id: 'products', label: 'Products', icon: Package },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'orders', label: 'Orders', icon: ShoppingBag },
          { id: 'reviews', label: 'Reviews', icon: MessageSquare },
          { id: 'analytics', label: 'Analytics', icon: LayoutDashboard },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t.id
              ? 'bg-black text-white shadow-lg shadow-black/20'
              : 'text-gray-400 hover:text-black hover:bg-white'
              }`}
          >
            <t.icon size={14} />
            {t.label}
            {t.id === 'users' && newUsersCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100">
                {newUsersCount}
              </span>
            )}
            {t.id === 'orders' && newOrdersCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">
                {newOrdersCount}
              </span>
            )}
            {t.id === 'orders' && returnRequestCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100">
                {returnRequestCount}
              </span>
            )}
          </button>
        ))}
      </div>
      <div>
        {tab === 'products' && <AdminProducts />}
        {tab === 'users' && <AdminUsers />}
        {tab === 'orders' && <AdminOrders />}
        {tab === 'reviews' && <AdminReviews />}
        {tab === 'analytics' && <AdminAnalytics />}

      </div>
    </div>
  )
}
