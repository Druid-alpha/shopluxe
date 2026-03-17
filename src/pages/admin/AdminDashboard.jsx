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
  const seenUserIdsRef = useRef(new Set())
  const isFirstUserLoadRef = useRef(true)
  const { data } = useGetAllOrdersQuery(undefined, {
    pollingInterval: 15000,
    refetchOnFocus: true,
    refetchOnReconnect: true
  })
  const orders = data?.orders || []
  const returnRequestCount = orders.filter(o => o?.returnStatus === 'requested').length
  const newOrderCount = orders.filter(o => {
    const status = String(o?.status || 'pending').toLowerCase()
    return status === 'pending' && o?.paymentStatus !== 'failed' && o?.paymentStatus !== 'refunded'
  }).length

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
      if (isFirstUserLoadRef.current) {
        seenUserIdsRef.current = new Set(users.map(u => String(u?._id)).filter(Boolean))
        isFirstUserLoadRef.current = false
        return
      }
      const newUsers = users.filter(u => {
        const id = String(u?._id || '')
        return id && !seenUserIdsRef.current.has(id)
      })
      if (newUsers.length > 0) {
        newUsers.forEach(u => {
          const id = String(u?._id || '')
          if (id) seenUserIdsRef.current.add(id)
        })
        setNewUsersCount(prev => prev + newUsers.length)
        toast({
          title: 'New user registered',
          description: `${newUsers.length} new user${newUsers.length > 1 ? 's' : ''} joined.`
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

  const handleTabChange = (id) => {
    setTab(id)
    if (id === 'users') setNewUsersCount(0)
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
            {t.id === 'orders' && newOrderCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">
                {newOrderCount}
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
