import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { Heart } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { addGuestCart } from '../cart/cartSlice'
import { toggleGuestWishlist } from '../wishlist/wishlistSlice'
import { setCart } from '../cart/cartSlice'
import * as cartApi from '../cart/cartApi'
import {
  useGetWishlistQuery,
  useToggleWishlistMutation,
} from '../wishlist/wishlistApi'
import PriceDisplay from '@/components/PriceDisplay'
import StarRating from './StarRating'

export default function ProductCard({ product, featured }) {
  if (!product) return null

  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isAdding, setIsAdding] = React.useState(false)

  const { data } = useGetWishlistQuery()
  const [toggleWishlist] = useToggleWishlistMutation()
  const wishlist = data?.wishlist || []

  const isWishlisted = wishlist.some((p) => p?._id === product._id)

  const totalStock = (product.stock > 0)
    ? product.stock
    : (product.variants?.reduce((sum, v) => sum + (v?.stock || 0), 0) || 0)
  const isOutOfStock = totalStock < 1

  const user = useAppSelector((state) => state.auth.user)
  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
     dispatch(addGuestCart({
  productId: product._id,
  title: product.title,
  price: product.price,
  productImage: product.images?.[0]?.url,
  qty: 1,
  variant: null
}))

      toast({ title: 'Added to cart (Guest)' })
       navigate('/cart')
      return
    }

    setIsAdding(true)
    try {
      const updatedCart = await cartApi.addToCart(product._id, 1, null)
      dispatch(setCart(updatedCart))
      toast({ title: 'Added to cart', description: product.title })
      navigate('/cart')
    } catch (err) {
      console.error('Add to cart failed:', err)
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to add to cart',
        variant: 'destructive',
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      dispatch(toggleGuestWishlist(product._id))
      toast({
        title: 'Wishlist updated (Guest)'
      })
      return
    }

    try {
      await toggleWishlist(product._id).unwrap()
      toast({
        title: isWishlisted
          ? 'Removed from wishlist'
          : 'Added to wishlist ❤️'
      })
    } catch {
      toast({
        title: 'Something went wrong',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="group relative bg-white border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* WISHLIST BUTTON */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleWishlist}
          className={`p-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm transition-all duration-300 ${isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-black'
            }`}
        >
          <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
        </button>
      </div>

      {/* PRODUCT IMAGE */}
      <Link to={`/products/${product._id}`} className="block relative aspect-[4/5] overflow-hidden bg-gray-50">
        {/* SALE BADGE */}
        {product.discount > 0 && (
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
            <span className="bg-black text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 shadow-xl rounded-sm">
              Sale
            </span>
            <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.1em] px-2 py-1 shadow-lg rounded-sm text-center">
              -{product.discount}%
            </span>
          </div>
        )}

        <img
          src={product.images?.[0]?.url}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.png'
          }}
        />

        {/* QUICK ADD OVERLAY */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className="w-full bg-white/95 backdrop-blur-md text-black hover:bg-black hover:text-white border-0 shadow-lg text-xs font-bold uppercase tracking-wider h-11"
          >
            {isAdding ? 'Adding...' : (isOutOfStock ? 'Sold Out' : 'Quick Add')}
          </Button>
        </div>
      </Link>

      {/* PRODUCT INFO */}
      <div className="p-5 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <Link to={`/products/${product._id}`} className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
              {product.title}
            </h3>
          </Link>
          <PriceDisplay price={product.price} discount={product.discount} />
        </div>

        <div className="flex items-center gap-1.5 pt-1">
          <StarRating rating={product.avgRating} size={14} />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
            ({product?.avgRating?.toFixed(1) ?? '0.0'})
          </span>
        </div>
      </div>
    </div>
  )
}
