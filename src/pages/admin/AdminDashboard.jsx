

import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import AdminProducts from './AdminProducts'
import AdminUSers from './adminUSers'
import AdminOrders from './AdminOrders'
import AdminAnalytics from './AdminAnalytics'

export default function AdminDashboard() {
    const[tab, setTab]=useState('products')
  return (
    <div className='p-6 space-y-6'>
   <h1 className='text-2xl font-bold'>Admin Dashboard</h1>
    <div className='flex  gap-2 mb-4'>
<Button onClick={()=>setTab('products')}>Products</Button>
<Button onClick={()=>setTab('users')}>Users</Button>
<Button onClick={()=>setTab('orders')}>Orders</Button>
<Button onClick={()=>setTab('analytics')}>Analytics</Button>
    </div>
    <div>
        {tab === 'products' && <AdminProducts/>}
        {tab === 'users' && <AdminUSers/>}
        {tab === 'orders' && <AdminOrders/>}
        {tab === 'analytics' && <AdminAnalytics/>}

    </div>
    </div>
  )
}
