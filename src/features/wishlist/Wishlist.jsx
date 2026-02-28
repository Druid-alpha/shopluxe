import { Button } from '@/components/ui/button'
import { Heart, ShoppingCart, X } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'
import { useGetWishlistQuery, useToggleWishlistMutation } from './wishlistApi'
import { useAppDispatch } from '@/app/hooks'
import { useToast } from '@/hooks/use-toast'
import { setCart } from '../cart/cartSlice'
import * as cartApi from '../cart/cartApi'

export default function Wishlist() {
  const dispatch = useAppDispatch()
  const { toast } = useToast()

  // Fetch wishlist from backend
  const { data, isLoading, isError } = useGetWishlistQuery()
  const [toggleWishlist] = useToggleWishlistMutation()

  const handleRemoveWishlist = async (product) => {
    try {
      await toggleWishlist(product._id).unwrap()
      toast({ title: 'Removed from wishlist' })
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to remove item', variant: 'destructive' })
    }
  }

  const handleAddToCart = async (product) => {
    try {
      // Add as base product (no variant selected in wishlist usually)
      const updatedCart = await cartApi.addToCart(product._id, 1, null)
      dispatch(setCart(updatedCart))
      toast({ title: 'Added to Cart' })
    } catch (err) {
      toast({ title: 'Error', description: err.data?.message || 'Failed to add to cart', variant: 'destructive' })
    }
  }

  if (isLoading) return <p className="text-center p-10">Loading...</p>
  if (isError) return <p className="text-center p-10">Error fetching wishlist</p>

  const wishlist = data?.wishlist || []

  if (!wishlist.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <Heart className="text-gray-300" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 max-w-xs mb-8">
          Save items you love to find them later and keep track of what you want.
        </p>
        <Button asChild size="lg" className="rounded-full px-8 bg-black hover:bg-gray-800 transition-all">
          <Link to="/products">Explore Products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Saved Items</h1>
          <p className="text-gray-500 mt-1">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} in your wishlist</p>
        </div>
        <Button variant="outline" asChild className="hidden sm:flex rounded-full border-gray-200">
          <Link to="/products">Continue Shopping</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {wishlist.map((product) => (
          <div
            key={product._id}
            className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            {/* Image Container */}
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
              <img
                src={product.images?.[0]?.url || '/placeholder.png'}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <button
                onClick={() => handleRemoveWishlist(product)}
                className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-all shadow-sm"
                title="Remove from wishlist"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-black transition-colors">
                  {product.title}
                </h3>
                <p className="text-lg font-bold text-gray-900">₦{product.price.toLocaleString()}</p>
              </div>

              <div className="pt-2">
                <Button
                  className="w-full rounded-xl bg-black hover:bg-gray-800 text-white shadow-sm transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingCart size={16} />
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
