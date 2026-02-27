import React from 'react'
import { Route, Routes } from 'react-router-dom'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { Toaster } from './components/ui/toaster'

import Home from './pages/Home'
import Products from './pages/Products'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from '../Register'
import Profile from './pages/Profile'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'

import Wishlist from './features/wishlist/Wishlist'
import ProtectedRoute from './components/ProtectedRoute'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminUSers from './pages/admin/AdminUsers'
import AdminOrders from './pages/admin/AdminOrders'
import ProductDetails from './features/products/ProductDetails'
import OrderReceipt from './pages/orderReceipt'

export default function App() {
  return (
    <>
      <Navbar />

      <main className="min-h-[80vh] p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />

          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={['user', 'admin']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute roles={['user']}>
                <Checkout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/wishlist"
            element={
              <ProtectedRoute roles={['user']}>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute roles={['user']}>
                <OrderReceipt />
              </ProtectedRoute>
            }
          />
          {/* ADMIN ROUTES */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/products"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminProducts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminUSers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <Footer />
      <Toaster />
    </>
  )
}
