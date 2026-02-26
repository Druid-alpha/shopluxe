import React, { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logoutAndReset } from '@/features/auth/authSlice'
import { useLogoutMutation } from '@/features/auth/authApi'

import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Heart, LogOut, Menu, Shield, ShoppingCart, User, X } from 'lucide-react'
import { useGetWishlistQuery } from '@/features/wishlist/wishlistApi'

export default function Navbar() {
  const { user } = useAppSelector((state) => state.auth)
  const cartCount = useAppSelector((state) => state.cart.items.length)
  const dispatch = useAppDispatch()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Wishlist count
  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: !user })
  const wishlistCount = wishlistData?.wishlist?.length || 0

  const [logoutApi] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap()
    } finally {
      dispatch(logoutAndReset())
    }
  }

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const adminLinks = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Products', path: '/admin/products' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Orders', path: '/admin/orders' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">
          ShopLuxe
        </Link>
<form
  onSubmit={(e) => {
    e.preventDefault()
    const q = e.target.search.value
    if (q) window.location.href = `/products?search=${q}`
  }}
  className="relative"
>
  <input
    name="search"
    placeholder="Search products..."
    className="border rounded-full px-4 py-1.5 text-sm w-full focus:outline-none"
  />
</form>
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/products">Products</NavLink>

          <NavLink to="/wishlist" className="relative">
            <Heart />
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 text-xs bg-pink-500 text-white rounded-full px-1.5">
                {wishlistCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/cart" className="relative">
            <ShoppingCart />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 text-xs bg-red-500 text-white rounded-full px-1.5">
                {cartCount}
              </span>
            )}
          </NavLink>

          {/* User menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} />
                  ) : (
                    <AvatarFallback>
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>

                {/* Admin dropdown */}
                {user.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    {adminLinks.map((link) => (
                      <DropdownMenuItem asChild key={link.path}>
                        <Link to={link.path}>{link.name}</Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={clsx(
          'fixed inset-y-0 right-0 z-50 w-64 bg-white border-l shadow-lg transform transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="px-4 py-6 space-y-4">
          <Link to="/products" className="flex items-center gap-3 py-2">
            <Menu className="h-5 w-5" />
            Products
          </Link>

          <Link to="/wishlist" className="flex items-center gap-3 py-2">
            <Heart className="h-5 w-5" />
            Wishlist
            {wishlistCount > 0 && (
              <span className="ml-auto text-xs bg-pink-500 text-white rounded-full px-2">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link to="/cart" className="flex items-center gap-3 py-2">
            <ShoppingCart className="h-5 w-5" />
            Cart
            {cartCount > 0 && (
              <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-2">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <Link to="/profile" className="flex items-center gap-3 py-2">
                <User className="h-5 w-5" />
                Profile
              </Link>

              {user.role === 'admin' &&
                adminLinks.map((link) => (
                  <Link key={link.path} to={link.path} className="flex items-center gap-3 py-2">
                    <Shield className="h-5 w-5" />
                    {link.name}
                  </Link>
                ))}

              <Button
                variant="destructive"
                className="w-full flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-3 py-2">
                <User className="h-5 w-5" />
                Login
              </Link>

              <Link to="/register" className="flex items-center gap-3 py-2">
                <User className="h-5 w-5" />
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
