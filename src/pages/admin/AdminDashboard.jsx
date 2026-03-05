

import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import AdminProducts from './AdminProducts'
import AdminUsers from './AdminUsers'
import AdminOrders from './AdminOrders'
import AdminAnalytics from './AdminAnalytics'
import AdminReviews from './AdminReviews'
import { LayoutDashboard, Package, ShoppingBag, Users, MessageSquare } from 'lucide-react'

export default function AdminDashboard() {
  const [tab, setTab] = useState('products')
  return (
    <div className='p-6 space-y-6'>
      <h1 className='text-2xl font-bold'>Admin Dashboard</h1>
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
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t.id
              ? 'bg-black text-white shadow-lg shadow-black/20'
              : 'text-gray-400 hover:text-black hover:bg-white'
              }`}
          >
            <t.icon size={14} />
            {t.label}
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
