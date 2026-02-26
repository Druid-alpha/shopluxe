export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-14 grid gap-10 sm:grid-cols-2 md:grid-cols-4">

        {/* BRAND */}
        <div>
          <h3 className="text-white text-xl font-bold mb-4">ShopLuxe</h3>
          <p className="text-sm leading-relaxed">
            Premium shopping experience for fashion, electronics & groceries.
          </p>
        </div>

        {/* SHOP */}
        <div>
          <h4 className="text-white font-semibold mb-4">Shop</h4>
          <ul className="space-y-3 text-sm">
            <li><a className="hover:text-white" href="/products">All Products</a></li>
            <li><a className="hover:text-white" href="/products?featured=true">Featured</a></li>
            <li><a className="hover:text-white" href="/wishlist">Wishlist</a></li>
          </ul>
        </div>

        {/* ACCOUNT */}
        <div>
          <h4 className="text-white font-semibold mb-4">Account</h4>
          <ul className="space-y-3 text-sm">
            <li><a className="hover:text-white" href="/login">Login</a></li>
            <li><a className="hover:text-white" href="/register">Register</a></li>
            <li><a className="hover:text-white" href="/profile">Profile</a></li>
          </ul>
        </div>

        {/* SUPPORT */}
        <div>
          <h4 className="text-white font-semibold mb-4">Support</h4>
          <ul className="space-y-3 text-sm">
            <li className="hover:text-white cursor-pointer">Help Center</li>
            <li className="hover:text-white cursor-pointer">Privacy Policy</li>
            <li className="hover:text-white cursor-pointer">Terms & Conditions</li>
          </ul>
        </div>

      </div>

      {/* COPYRIGHT */}
      <div className="border-t border-gray-700 py-4 text-center text-xs sm:text-sm">
        © {new Date().getFullYear()} ShopLuxe. All rights reserved.
      </div>
    </footer>
  )
}