import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import AdminProducts from './AdminProducts'
import AdminUsers from './AdminUsers'
import AdminOrders from './AdminOrders'
import AdminAnalytics from './AdminAnalytics'
import AdminReviews from './AdminReviews'
import { LayoutDashboard, Package, ShoppingBag, Users, MessageSquare } from 'lucide-react'
import { useGetAllOrdersQuery } from '@/features/orders/orderApi'

export default function AdminDashboard() {
  const [tab, setTab] = useState('products')
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
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t.id
              ? 'bg-black text-white shadow-lg shadow-black/20'
              : 'text-gray-400 hover:text-black hover:bg-white'
              }`}
          >
            <t.icon size={14} />
            {t.label}
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
