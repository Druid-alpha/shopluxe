import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/button'
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

export default function ProductCard({ product }) {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isAdding, setIsAdding] = React.useState(false)

  const { data } = useGetWishlistQuery()
  const [toggleWishlist] = useToggleWishlistMutation()
  const wishlist = data?.wishlist || []

  const isWishlisted = wishlist.some((p) => p?._id === product?._id)

  const totalStock = (product?.stock > 0)
    ? product.stock
    : (product?.variants?.reduce((sum, v) => sum + (v?.stock || 0), 0) || 0)
  const isOutOfStock = totalStock < 1
  const discountedPrice = product?.discount > 0
    ? Math.round((product?.price || 0) * (1 - product.discount / 100))
    : (product?.price || 0)
  const primaryImageUrl = React.useMemo(() => {
    const candidates = [
      product.images?.[0]?.url,
      ...(product.images || []).map((img) => img?.url),
      product.image?.url,
      product.image,
      product.thumbnail,
      ...(product.variants || []).map((variant) => variant?.image?.url),
    ]
    return candidates.find((value) => typeof value === 'string' && value.trim().length > 0) || '/placeholder.png'
  }, [product])
  const [imageSrc, setImageSrc] = React.useState(primaryImageUrl)

  React.useEffect(() => {
    setImageSrc(primaryImageUrl)
  }, [primaryImageUrl, product?._id])

  const user = useAppSelector((state) => state.auth.user)
  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product) return

    if (!user) {
      dispatch(addGuestCart({
        productId: product._id,
        title: product.title,
        price: discountedPrice,
        basePrice: product.price || 0,
        discount: product.discount || 0,
        productImage: primaryImageUrl,
        productStock: totalStock,
        qty: 1,
        variant: null,
        addedAt: new Date().toISOString(),
        key: `${product._id}-default`
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
    if (!product) return

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

  if (!product) return null

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
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 animate-in fade-in zoom-in duration-500">
            <span className="bg-white/60 backdrop-blur-lg text-slate-900 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 shadow-[0_8px_20px_rgba(255,255,255,0.3),0_4px_12px_rgba(0,0,0,0.1)] rounded-xl border border-white/50 border-t-white/80">
              Sale
            </span>
            <span className="bg-rose-500/80 backdrop-blur-lg text-white text-[10px] font-black uppercase tracking-[0.1em] px-2.5 py-1.2 shadow-[0_10px_20px_rgba(244,63,94,0.4)] rounded-xl text-center border border-white/30 border-t-white/50">
              -{product.discount}%
            </span>
          </div>
        )}

        <img
          src={imageSrc}
          alt={product.title}
          className="w-full h-full object-contain p-2 sm:p-3 transition-transform duration-700 group-hover:scale-105"
          onError={() => {
            if (imageSrc !== '/placeholder.png') setImageSrc('/placeholder.png')
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
      <div className="p-3 sm:p-5 space-y-2">
        <div className="flex justify-between items-start gap-2 min-w-0">
          <Link to={`/products/${product._id}`} className="flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 break-words group-hover:text-primary transition-colors">
              {product.title}
            </h3>
          </Link>
          <PriceDisplay price={product.price} discount={product.discount} className="shrink-0 text-right" />
        </div>

        <div className="flex items-center gap-1 pt-1">
          <StarRating rating={product.avgRating} size={12} />
          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
            ({product?.avgRating?.toFixed(1) ?? '0.0'})
          </span>
        </div>
      </div>
    </div>
  )
}
