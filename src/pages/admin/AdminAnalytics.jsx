import React, { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

const palette = ['#0f172a', '#0ea5e9', '#f97316', '#10b981', '#f43f5e', '#a855f7', '#22c55e']

const formatCurrency = (value) => {
  const num = Number(value || 0)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num)
}

const formatShortNumber = (value) => {
  const num = Number(value || 0)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return `${num}`
}

const normalizeStatus = (value, fallback = 'unknown') => {
  const raw = String(value || '').trim().toLowerCase()
  return raw || fallback
}

const makeDateKey = (date) => new Date(date).toISOString().slice(0, 10)

export default function AdminAnalytics() {
  const token = useAppSelector((state) => state.auth.token)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])

  useEffect(() => {
    let active = true
    const fetchAll = async () => {
      try {
        setLoading(true)
        setError('')
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
        const [usersRes, ordersRes, productsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/admin/users`, { headers, credentials: 'include' }),
          fetch(`${import.meta.env.VITE_API_URL}/orders`, { headers, credentials: 'include' }),
          fetch(`${import.meta.env.VITE_API_URL}/products?limit=1000`, { headers })
        ])
        const [usersData, ordersData, productsData] = await Promise.all([
          usersRes.json(),
          ordersRes.json(),
          productsRes.json()
        ])
        if (!usersRes.ok) throw new Error(usersData.message || 'Failed to load users')
        if (!ordersRes.ok) throw new Error(ordersData.message || 'Failed to load orders')
        if (!productsRes.ok) throw new Error(productsData.message || 'Failed to load products')
        if (!active) return
        setUsers(Array.isArray(usersData.users) ? usersData.users : [])
        setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : [])
        setProducts(Array.isArray(productsData.products) ? productsData.products : [])
      } catch (err) {
        if (!active) return
        setError(err?.message || 'Failed to load analytics')
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchAll()
    return () => {
      active = false
    }
  }, [token])

  const {
    totalRevenue,
    totalOrders,
    totalUsers,
    avgOrderValue,
    pendingOrders,
    returnRequests,
    lowStockCount
  } = useMemo(() => {
    const paidOrders = orders.filter((order) => {
      const payment = normalizeStatus(order?.paymentStatus)
      return payment !== 'failed' && payment !== 'refunded'
    })
    const revenue = paidOrders.reduce((sum, order) => sum + Number(order?.totalPrice || 0), 0)
    const pending = orders.filter((order) => normalizeStatus(order?.status, 'pending') === 'pending').length
    const returns = orders.filter((order) => normalizeStatus(order?.returnStatus) === 'requested').length
    const lowStock = products.filter((product) => {
      const stock = Number(product?.countInStock ?? product?.stock ?? product?.quantity ?? 0)
      return stock > 0 && stock <= 5
    }).length
    return {
      totalRevenue: revenue,
      totalOrders: orders.length,
      totalUsers: users.length,
      avgOrderValue: paidOrders.length ? revenue / paidOrders.length : 0,
      pendingOrders: pending,
      returnRequests: returns,
      lowStockCount: lowStock
    }
  }, [orders, products, users])

  const trendData = useMemo(() => {
    const days = 30
    const now = new Date()
    const keys = []
    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      keys.push(makeDateKey(date))
    }
    const base = new Map(keys.map((key) => [key, { date: key, revenue: 0, orders: 0 }]))
    orders.forEach((order) => {
      if (!order?.createdAt) return
      const key = makeDateKey(order.createdAt)
      if (!base.has(key)) return
      const entry = base.get(key)
      entry.orders += 1
      const payment = normalizeStatus(order?.paymentStatus)
      if (payment !== 'failed' && payment !== 'refunded') {
        entry.revenue += Number(order?.totalPrice || 0)
      }
    })
    return Array.from(base.values())
  }, [orders])

  const statusData = useMemo(() => {
    const map = new Map()
    orders.forEach((order) => {
      const status = normalizeStatus(order?.status, 'pending')
      map.set(status, (map.get(status) || 0) + 1)
    })
    return Array.from(map.entries()).map(([status, value]) => ({
      status,
      value
    }))
  }, [orders])

  const paymentData = useMemo(() => {
    const map = new Map()
    orders.forEach((order) => {
      const status = normalizeStatus(order?.paymentStatus, 'pending')
      map.set(status, (map.get(status) || 0) + 1)
    })
    return Array.from(map.entries()).map(([status, value]) => ({
      status,
      value
    }))
  }, [orders])

  const categoryData = useMemo(() => {
    const productMap = new Map(products.map((product) => [String(product?._id || ''), product]))
    const revenueMap = new Map()
    orders.forEach((order) => {
      const items = Array.isArray(order?.items) ? order.items : []
      items.forEach((item) => {
        const productId = String(item?.product || item?.productId || item?._id || '')
        const product = productMap.get(productId)
        const category = String(product?.category || item?.category || 'Uncategorized')
        const value = Number(item?.price || item?.newPrice || 0) * Number(item?.quantity || 0)
        revenueMap.set(category, (revenueMap.get(category) || 0) + value)
      })
    })
    return Array.from(revenueMap.entries())
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [orders, products])

  const topProducts = useMemo(() => {
    const map = new Map()
    orders.forEach((order) => {
      const items = Array.isArray(order?.items) ? order.items : []
      items.forEach((item) => {
        const name = String(item?.name || 'Unknown')
        const qty = Number(item?.quantity || 0)
        map.set(name, (map.get(name) || 0) + qty)
      })
    })
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [orders])

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-48 rounded-2xl bg-gradient-to-br from-gray-50 via-white to-gray-100 animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-sm text-rose-700">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white via-gray-50 to-gray-100 p-6">
        <h2 className="text-lg font-black uppercase tracking-widest">Store Pulse</h2>
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mt-1">Last 30 days performance</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Revenue', value: formatCurrency(totalRevenue), meta: 'Paid orders only' },
            { label: 'Total Orders', value: formatShortNumber(totalOrders), meta: 'All statuses' },
            { label: 'Customers', value: formatShortNumber(totalUsers), meta: 'Registered users' },
            { label: 'Avg Order Value', value: formatCurrency(avgOrderValue), meta: 'Paid orders average' },
            { label: 'Pending Orders', value: formatShortNumber(pendingOrders), meta: 'Needs fulfillment' },
            { label: 'Return Requests', value: formatShortNumber(returnRequests), meta: 'Awaiting action' },
            { label: 'Low Stock SKUs', value: formatShortNumber(lowStockCount), meta: '≤ 5 units' }
          ].map((card, index) => (
            <div
              key={card.label}
              className="rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{card.label}</p>
              <p className="mt-2 text-2xl font-black">{card.value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-gray-400">{card.meta}</p>
              <div className="mt-3 h-1.5 rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${35 + (index % 5) * 12}%`, backgroundColor: palette[index % palette.length] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-gray-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">Revenue Trend</h3>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mt-1">Daily orders + revenue</p>
            </div>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value, name) => (name === 'revenue' ? formatCurrency(value) : value)}
                  labelStyle={{ fontSize: 10 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fill="url(#colorRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="orders" stroke="#111827" fillOpacity={0} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6">
          <h3 className="text-sm font-black uppercase tracking-widest">Payment Mix</h3>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mt-1">Current payment status</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentData} dataKey="value" nameKey="status" outerRadius={90} innerRadius={55}>
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${entry.status}`} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-gray-100 bg-white p-6">
          <h3 className="text-sm font-black uppercase tracking-widest">Order Status</h3>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mt-1">Fulfillment breakdown</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f172a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6">
          <h3 className="text-sm font-black uppercase tracking-widest">Top Categories</h3>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mt-1">Revenue contribution</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="category" type="category" width={90} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="value" fill="#f97316" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-3xl border border-gray-100 bg-white p-6">
          <h3 className="text-sm font-black uppercase tracking-widest">Top Products</h3>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mt-1">Most units sold</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6">
          <h3 className="text-sm font-black uppercase tracking-widest">Inventory Snapshot</h3>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mt-1">Quick health check</p>
          <div className="mt-6 space-y-4">
            {[
              { label: 'Total Products', value: products.length },
              { label: 'Low Stock', value: lowStockCount },
              { label: 'Return Requests', value: returnRequests }
            ].map((item, index) => (
              <div key={item.label} className="rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">{item.label}</p>
                  <p className="text-xl font-black">{formatShortNumber(item.value)}</p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${40 + index * 15}%`, backgroundColor: palette[(index + 2) % palette.length] }}
                  />
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500">
              Tip: Click into orders to update statuses, resolve returns, and restock directly from the order drawer.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
