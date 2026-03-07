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
            <li><a className="hover:text-white transition-colors" href="/products">Latest Arrivals</a></li>
            <li><a className="hover:text-white transition-colors" href="/products?featured=true">Featured Items</a></li>
            <li><a className="hover:text-white transition-colors" href="/wishlist">Your Wishlist</a></li>
          </ul>
        </div>

        {/* ACCOUNT */}
        <div className="space-y-6">
          <h4 className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Account</h4>
          <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
            <li><a className="hover:text-white transition-colors" href="/profile">Dashboard</a></li>
            <li><a className="hover:text-white transition-colors" href="/login">Sign In</a></li>
            <li><a className="hover:text-white transition-colors" href="/register">Create Account</a></li>
          </ul>
        </div>

        {/* SUPPORT */}
        <div className="space-y-6">
          <h4 className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Support</h4>
          <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
            <li><a className="hover:text-white transition-colors" href="/help-center">Help Center</a></li>
            <li><a className="hover:text-white transition-colors" href="/privacy-policy">Privacy Policy</a></li>
            <li><a className="hover:text-white transition-colors" href="/terms-of-service">Terms of Service</a></li>
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
