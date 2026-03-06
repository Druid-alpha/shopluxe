import * as React from 'react'
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

import { Heart, LogOut, Menu, Shield, ShoppingCart, User, X, Laptop2, Shirt, ShoppingBasket, ArrowRight, Facebook, Instagram, Twitter, MessageCircle, Music2, Moon, Sun } from 'lucide-react'
import { useGetWishlistQuery } from '@/features/wishlist/wishlistApi'

export default function Navbar() {
  const { user } = useAppSelector((state) => state.auth)
  const cartCount = useAppSelector((state) => state.cart.items.length)
  const dispatch = useAppDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleTheme = () => {
    const root = document.documentElement
    const nextDark = !root.classList.contains('dark')
    root.classList.toggle('dark', nextDark)
    localStorage.setItem('theme', nextDark ? 'dark' : 'light')
    setIsDark(nextDark)
  }

  // Wishlist count
  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: !user })
  const wishlistCount = wishlistData?.wishlist?.length || 0

  const [logoutApi] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      setMobileOpen(false)
      // Immediate local clear for mobile responsiveness
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      dispatch(logoutAndReset())

      await logoutApi().unwrap()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      navigate('/login')
      // Force reload to ensure all states are wiped
      setTimeout(() => window.location.reload(), 100)
    }
  }

  React.useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const adminLinks = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Products', path: '/admin/products' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Orders', path: '/admin/orders' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-background/90 border-b border-border backdrop-blur">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex items-center">
            <span className="text-xl md:text-3xl font-black tracking-tighter text-foreground uppercase border-b-4 border-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              ShopLuxe
            </span>
          </div>
        </Link>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const q = e.target.search.value
            if (q) navigate(`/products?search=${q}`)
          }}
          className="relative hidden lg:block flex-1 max-w-sm mx-8"
        >
          <input
            name="search"
            placeholder="Find your aesthetic..."
            className="border-2 border-border bg-card rounded-xl px-6 py-2.5 text-xs font-bold w-full focus:outline-none focus:border-primary transition-all"
          />
        </form>
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/products" className={({ isActive }) => `text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-black ${isActive ? 'text-black border-b-2 border-black' : 'text-gray-400'}`}>Collections</NavLink>

          <NavLink to="/wishlist" className="relative text-gray-400 hover:text-black transition-colors">
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 text-[8px] font-black bg-black text-white rounded-full w-4 h-4 flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/cart" className="relative text-gray-400 hover:text-black transition-colors">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 text-[8px] font-black bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </NavLink>

          <button
            type="button"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary transition-colors flex items-center justify-center"
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

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

          {/* Desktop Social Links */}
          <div className="hidden xl:flex items-center gap-3 pl-8 border-l border-gray-100 ml-4">
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Facebook size={16} /></a>
            <a href="#" className="text-gray-400 hover:text-pink-600 transition-colors"><Instagram size={16} /></a>
            <a href="#" className="text-gray-400 hover:text-green-600 transition-colors"><MessageCircle size={16} /></a>
          </div>
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center md:hidden">
          <button
            className="p-2 -mr-2 text-foreground"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* MOBILE DRAWER (Shopify Standard) */}
      <div
        className={clsx(
          'fixed inset-0 z-[100] transition-opacity duration-300 md:hidden',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer */}
        <div
          className={clsx(
            'absolute inset-y-0 left-0 w-full max-w-[320px] bg-background shadow-2xl transform transition-transform duration-500 ease-out flex flex-col',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-border flex justify-between items-center bg-background sticky top-0 z-10">
            <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tighter uppercase italic">ShopLuxe</span>
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full flex items-center justify-center border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X size={24} className="text-foreground" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain bg-background">
            {/* Search Bar */}
            <div className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const q = e.target.search.value
                  if (q) {
                    navigate(`/products?search=${q}`)
                    setMobileOpen(false)
                  }
                }}
                className="relative"
              >
                <input
                  name="search"
                  placeholder="What are you looking for?"
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-black transition-all"
                />
              </form>
            </div>

            {/* Main Navigation */}
            <div className="px-4 space-y-1">
              <p className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Navigation</p>

              <Link to="/products" className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
                <span className="text-sm font-black uppercase tracking-tight">All Collections</span>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-black transition-colors" />
              </Link>

              {/* Shop by Category (Shopify Feature) */}
              <div className="pt-6 pb-2 space-y-1">
                <p className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Shop by category</p>

                {[
                  { name: 'Electronics', path: '/products?category=electronics', icon: Laptop2, color: 'text-blue-500' },
                  { name: 'Clothing', path: '/products?category=clothing', icon: Shirt, color: 'text-orange-500' },
                  { name: 'Groceries', path: '/products?category=groceries', icon: ShoppingBasket, color: 'text-green-500' },
                ].map(cat => (
                  <Link
                    key={cat.name}
                    to={cat.path}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <div className={clsx("w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center", cat.color)}>
                      <cat.icon size={20} />
                    </div>
                    <span className="text-sm font-black uppercase tracking-tight">{cat.name}</span>
                  </Link>
                ))}
              </div>

              {/* Interaction Quick Links */}
              <div className="pt-6 space-y-1">
                <p className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Your Luxe Space</p>
                <Link to="/wishlist" className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Heart size={20} className="text-pink-500" />
                    <span className="text-sm font-black uppercase tracking-tight">Wishlist</span>
                  </div>
                  {wishlistCount > 0 && (
                    <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 rounded-full">{wishlistCount}</span>
                  )}
                </Link>
                <Link to="/cart" className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <ShoppingCart size={20} className="text-slate-900" />
                    <span className="text-sm font-black uppercase tracking-tight">Shopping Bag</span>
                  </div>
                  {cartCount > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{cartCount}</span>
                  )}
                </Link>
              </div>

              {/* Admin Access */}
              {user?.role === 'admin' && (
                <div className="pt-6 space-y-1">
                  <p className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Admin Dashboard</p>
                  {adminLinks.map(link => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-purple-50 transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Shield size={18} className="text-purple-600" />
                      <span className="text-sm font-black uppercase tracking-tight text-purple-900">{link.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 mt-4 border-t border-gray-50">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Connect with us</p>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/share/1JM167YZNJ/?mibextid=wwXIfr" className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300">
                  <Facebook size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-green-600 hover:bg-green-600 hover:text-white transition-all duration-300">
                  <MessageCircle size={18} />
                </a>
                <a href="https://www.instagram.com/femzzyyyy" className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-pink-600 hover:bg-pink-600 hover:text-white transition-all duration-300">
                  <Instagram size={18} />
                </a>
                <a href="https://x.com/dreamboatey" className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-sky-500 hover:bg-sky-500 hover:text-white transition-all duration-300">
                  <Twitter size={18} />
                </a>
                <a href="" className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-black hover:bg-black hover:text-white transition-all duration-300">
                  <Music2 size={18} />
                </a>
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 mt-8">© 2026 ShopLuxe. All rights reserved.</p>
            </div>
          </div>

          {/* Drawer Footer (User Access) */}
          <div className="p-6 bg-gray-50/50 border-t">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    {user.avatar ? <AvatarImage src={user.avatar} /> : <AvatarFallback className="font-black text-xs">{user.name?.[0]}</AvatarFallback>}
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-tight truncate">{user.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="rounded-xl font-black uppercase tracking-widest text-[9px] h-11 border-gray-200" asChild onClick={() => setMobileOpen(false)}>
                    <Link to="/profile">Account</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-xl font-black uppercase tracking-widest text-[9px] h-11 shadow-lg shadow-red-200"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="rounded-xl font-black uppercase tracking-widest text-[9px] h-12 border-gray-200" asChild onClick={() => setMobileOpen(false)}>
                  <Link to="/login">Login</Link>
                </Button>
                <Button className="rounded-xl font-black uppercase tracking-widest text-[9px] h-12 shadow-lg shadow-gray-200" asChild onClick={() => setMobileOpen(false)}>
                  <Link to="/register">Join Luxee</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
