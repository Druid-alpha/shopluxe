import React, { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
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

import { Heart, LogOut, Menu, Shield, ShoppingCart, User, X, ShoppingBasket } from 'lucide-react'
import { useGetWishlistQuery } from '@/features/wishlist/wishlistApi'

export default function Navbar() {
  const { user } = useAppSelector((state) => state.auth)
  const cartCount = useAppSelector((state) => state.cart.items.length)
  const dispatch = useAppDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Wishlist count
  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: !user })
  const wishlistCount = wishlistData?.wishlist?.length || 0

  const [logoutApi] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      setMobileOpen(false)
      await logoutApi().unwrap()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      dispatch(logoutAndReset())
      navigate('/login')
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

      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <div className="bg-black text-white p-1.5 rounded-lg flex items-center justify-center">
            <ShoppingBasket size={22} className="text-white" />
          </div>
          ShopLuxe<span className="text-[10px] align-super">&trade;</span>
        </Link>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const q = e.target.search.value
            if (q) navigate(`/products?search=${q}`)
          }}
          className="relative hidden md:block flex-1 max-w-md mx-4"
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

      <div
        className={clsx(
          'fixed inset-y-0 right-0 z-50 w-72 bg-white border-l shadow-xl transform transition-transform duration-300 md:hidden flex flex-col',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <span className="font-bold text-lg">Menu</span>
          <button onClick={() => setMobileOpen(false)} className="p-1"><X size={20} /></button>
        </div>

        <div className="p-4 border-b">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const q = e.target.search.value
              if (q) {
                navigate(`/products?search=${q}`)
                setMobileOpen(false)
              }
            }}
          >
            <input
              name="search"
              placeholder="Search products..."
              className="border rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-black"
            />
          </form>
        </div>

        <div className="px-4 py-4 space-y-2 flex-1 overflow-y-auto">
          <Link to="/products" className="flex items-center gap-3 py-3 px-2 rounded-md hover:bg-gray-100">
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

          {/* Admin Links for Mobile */}
          {user?.role === 'admin' && (
            <div className="pt-4 space-y-2 border-t mt-4">
              <p className="px-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Management</p>
              {adminLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center gap-3 py-3 px-2 rounded-md hover:bg-gray-100 text-sm font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  <Shield className="h-4 w-4 text-purple-600" />
                  {link.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {user && (
          <div className="p-4 border-t bg-gray-50 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-gray-200">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} />
                ) : (
                  <AvatarFallback>
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-gray-500 truncate max-w-[180px]">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/profile">Profile</Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        )}

        {!user && (
          <div className="p-4 border-t grid grid-cols-2 gap-2">
            <Button variant="outline" asChild onClick={() => setMobileOpen(false)}>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild onClick={() => setMobileOpen(false)}>
              <Link to="/register">Sign up</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
