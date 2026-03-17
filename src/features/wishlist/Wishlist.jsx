import { Button } from '@/components/ui/button'
import { Heart, ShoppingCart, X } from 'lucide-react'
import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGetWishlistQuery, useToggleWishlistMutation } from './wishlistApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useToast } from '@/hooks/use-toast'
import { addGuestCart, setCart } from '../cart/cartSlice'
import * as cartApi from '../cart/cartApi'
import { useGetFeaturedProductsQuery, useGetProductsByIdsQuery } from '@/features/products/productApi'
import ProductCard from '@/features/products/ProductCard'
import { toggleGuestWishlist } from './wishlistSlice'

export default function Wishlist() {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isAdding, setIsAdding] = React.useState(false)
  const user = useAppSelector((state) => state.auth.user)
  const guestWishlist = useAppSelector((state) => state.wishlist.items)

  // Fetch wishlist from backend
  const { data, isLoading, isError } = useGetWishlistQuery(undefined, { skip: !user })
  const { data: featuredData } = useGetFeaturedProductsQuery()
  const [toggleWishlist] = useToggleWishlistMutation()
  const { data: guestProductsData, isLoading: isGuestLoading } = useGetProductsByIdsQuery(
    { ids: guestWishlist },
    { skip: !!user || guestWishlist.length === 0 }
  )

  const handleRemoveWishlist = async (product) => {
    try {
      if (!user) {
        dispatch(toggleGuestWishlist(product._id))
        toast({ title: 'Removed from wishlist (Guest)' })
        return
      }
      await toggleWishlist(product._id).unwrap()
      toast({ title: 'Removed from wishlist' })
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to remove item', variant: 'destructive' })
    }
  }

  const handleAddToCart = async (product) => {
    setIsAdding(true)
    try {
      if (!user) {
        dispatch(addGuestCart({
          productId: product._id,
          title: product.title,
          price: product.price || 0,
          basePrice: product.price || 0,
          discount: product.discount || 0,
          productImage: product.images?.[0]?.url || '/placeholder.png',
          baseProductImage: product.images?.[0]?.url || '/placeholder.png',
          productStock: product.totalStock ?? product.stock ?? 0,
          qty: 1,
          variant: null,
          productVariants: [],
          addedAt: new Date().toISOString(),
          key: `${product._id}-default`
        }))
        toast({ title: 'Added to cart (Guest)' })
        navigate('/cart')
        return
      }
      // Add as base product (no variant selected in wishlist usually)
      const updatedCart = await cartApi.addToCart(product._id, 1, null)
      dispatch(setCart(updatedCart))
      toast({ title: 'Added to Cart' })
      navigate('/cart')
    } catch (err) {
      toast({ title: 'Error', description: err.data?.message || 'Failed to add to cart', variant: 'destructive' })
    } finally {
      setIsAdding(false)
    }
  }

  if (isLoading || isGuestLoading) return <p className="text-center p-10">Loading...</p>
  if (isError && user) return <p className="text-center p-10">Error fetching wishlist</p>

  const wishlist = user
    ? (data?.wishlist || []).filter(p => p !== null)
    : (guestProductsData?.products || []).filter(p => p !== null)

  if (!wishlist.length) {
    const featured = featuredData?.products || []
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-white via-slate-50 to-amber-50 border border-gray-100 rounded-2xl">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 border border-dashed border-gray-200 shadow-sm">
          <Heart className="text-gray-300" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 max-w-xs mb-8">
          Save items you love to find them later and keep track of what you want.
        </p>
        <div className="flex items-center gap-3">
          <Button asChild size="lg" className="rounded-full px-8 bg-black hover:bg-gray-800 transition-all">
            <Link to="/products">Explore Products</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-8 border-gray-200">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
        {featured.length > 0 && (
          <div className="w-full max-w-6xl mt-10">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 mb-4">You may like</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}
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
            className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col"
          >
            {/* Image Container */}
            <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-amber-50">
              <img
                src={product.images?.[0]?.url || '/placeholder.png'}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <button
                onClick={() => handleRemoveWishlist(product)}
                className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-all shadow-sm hover:scale-110 active:scale-95"
                title="Remove from wishlist"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 flex-1">
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-black transition-colors">
                  {product.title}
                </h3>
                <p className="text-lg font-bold text-gray-900">NGN {product?.price?.toLocaleString() ?? 0}</p>
              </div>

              <div className="pt-2">
                <Button
                  className="w-full rounded-xl bg-black hover:bg-gray-800 text-white shadow-sm transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:-translate-y-0.5"
                  onClick={() => handleAddToCart(product)}
                  disabled={isAdding}
                >
                  <ShoppingCart size={16} />
                  {isAdding ? 'Adding...' : 'Add to Cart'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

