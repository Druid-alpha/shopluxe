import React, { useEffect, useState } from 'react'

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersRes, productsRes, ordersRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/users`, {
            credentials: 'include',
          }),
          fetch(`${import.meta.env.VITE_API_URL}/products`, {
            credentials: 'include',
          }),
          fetch(`${import.meta.env.VITE_API_URL}/orders`, {
            credentials: 'include',
          }),
        ])

        if (!usersRes.ok || !productsRes.ok || !ordersRes.ok) {
          throw new Error('Unauthorized')
        }

        const usersData = await usersRes.json()
        const productsData = await productsRes.json()
        const ordersData = await ordersRes.json()

        setStats({
          users: usersData.users?.length || usersData.length || 0,
          products: productsData.products?.length || productsData.length || 0,
          orders: ordersData.orders?.length || ordersData.length || 0,
        })
      } catch (err) {
        console.error('Failed to load analytics:', err)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-4">
      <div className="border p-4 rounded">Total Users: {stats.users}</div>
      <div className="border p-4 rounded">Total Products: {stats.products}</div>
      <div className="border p-4 rounded">Total Orders: {stats.orders}</div>
    </div>
  )
}
