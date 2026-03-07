import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-gray-400 mt-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-20 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">

        {/* BRAND */}
        <div className="space-y-6">
          <h3 className="text-white text-2xl font-black tracking-tighter uppercase whitespace-nowrap">ShopLuxe <span className="text-gray-500">Global</span></h3>
          <p className="text-xs leading-loose font-medium max-w-[200px]">
            The definitive destination for high-end fashion, electronics, and daily essentials.
          </p>
        </div>

        {/* SHOP */}
        <div className="space-y-6">
          <h4 className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Shop</h4>
          <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
            <li><Link className="hover:text-white transition-colors" to="/products">Latest Arrivals</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/products?featured=true">Featured Items</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/wishlist">Your Wishlist</Link></li>
          </ul>
        </div>

        {/* ACCOUNT */}
        <div className="space-y-6">
          <h4 className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Account</h4>
          <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
            <li><Link className="hover:text-white transition-colors" to="/profile">Dashboard</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/login">Sign In</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/register">Create Account</Link></li>
          </ul>
        </div>

        {/* SUPPORT */}
        <div className="space-y-6">
          <h4 className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Support</h4>
          <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
            <li><Link className="hover:text-white transition-colors" to="/help-center">Help Center</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/terms-of-service">Terms of Service</Link></li>
          </ul>
        </div>

      </div>

      {/* COPYRIGHT */}
      <div className="border-t border-white/5 py-8 text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">
        © {new Date().getFullYear()} ShopLuxe Global. All Rights Reserved.
      </div>
    </footer>
  )
}
