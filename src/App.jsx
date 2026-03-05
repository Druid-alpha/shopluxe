import * as React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import PageTransition from './components/PageTransition'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { Toaster } from './components/ui/toaster'
import ScrollToTop from './components/ScrollToTop'

import Home from './pages/Home'
import Products from './pages/Products'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'

import Profile from './pages/Profile'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'

import Wishlist from './features/wishlist/Wishlist'
import ProtectedRoute from './components/ProtectedRoute'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminUsers from './pages/admin/AdminUsers'
import AdminOrders from './pages/admin/AdminOrders'
import ProductDetails from './features/products/ProductDetails'
import OrderReceipt from './pages/orderReceipt'
import Register from './pages/Register'
import PaymentSuccess from './pages/PaymentSuccess'
import NotFound from './pages/NotFound'

export default function App() {
  const location = useLocation()

  return (
    <>
      <ScrollToTop />
      <Navbar />

      <main className="min-h-[80vh] p-4">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/products" element={<PageTransition><Products /></PageTransition>} />
            <Route path="/products/:id" element={<PageTransition><ProductDetails /></PageTransition>} />
            <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />

            <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
            <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
            <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
            <Route path="/verify-email" element={<PageTransition><VerifyEmail /></PageTransition>} />
            <Route path="/reset-password/:token" element={<PageTransition><ResetPassword /></PageTransition>} />

            <Route
              path="/profile"
              element={
                <ProtectedRoute roles={['user', 'admin']}>
                  <PageTransition><Profile /></PageTransition>
                </ProtectedRoute>
              }
            />

            <Route
              path="/checkout"
              element={
                <ProtectedRoute roles={['user', 'admin']}>
                  <PageTransition><Checkout /></PageTransition>
                </ProtectedRoute>
              }
            />

            <Route
              path="/wishlist"
              element={
                <ProtectedRoute roles={['user', 'admin']}>
                  <PageTransition><Wishlist /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute roles={['user', 'admin']}>
                  <PageTransition><OrderReceipt /></PageTransition>
                </ProtectedRoute>
              }
            />
            {/* ADMIN ROUTES */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <PageTransition><AdminDashboard /></PageTransition>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/products"
              element={
                <ProtectedRoute roles={['admin']}>
                  <PageTransition><AdminProducts /></PageTransition>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users"
              element={
                <ProtectedRoute roles={['admin']}>
                  <PageTransition><AdminUsers /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute roles={['admin']}>
                  <PageTransition><AdminOrders /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>

      <Footer />
      <Toaster />
    </>
  )
}
