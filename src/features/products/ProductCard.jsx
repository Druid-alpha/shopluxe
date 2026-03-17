import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { Heart, Scale } from 'lucide-react'
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

const buildProductVariants = (product) => {
  if (!product?.variants?.length) return []
  return product.variants.map(v => ({
    sku: v.sku,
    size: v.options?.size || '',
    colorName: v.options?.color?.name || '',
    colorHex: v.options?.color?.hex || null,
    stock: v.stock ?? 0,
    price: Number(v.price ?? 0),
    discount: Number(v.discount ?? 0),
    imageUrl: v.image?.url || null
  }))
}

export default function ProductCard({ product }) {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isAdding, setIsAdding] = React.useState(false)
  const [wishlistLoading, setWishlistLoading] = React.useState(false)

  const user = useAppSelector((state) => state.auth.user)
  const guestWishlist = useAppSelector((state) => state.wishlist.items)
  const { data } = useGetWishlistQuery(undefined, { skip: !user })
  const [toggleWishlist] = useToggleWishlistMutation()
  const wishlist = data?.wishlist || []

  const isWishlisted = user
    ? wishlist.some((p) => p?._id === product?._id)
    : guestWishlist.includes(product?._id)
  const [isCompared, setIsCompared] = React.useState(false)

  const baseTotalStock = (product?.stock > 0)
    ? product.stock
    : (product?.variants?.reduce((sum, v) => sum + (v?.stock || 0), 0) || 0)
  const isOutOfStock = baseTotalStock < 1
  const maxVariantDiscount = Array.isArray(product?.variants)
    ? product.variants.reduce((max, v) => Math.max(max, Number(v?.discount || 0)), 0)
    : 0
  const maxDiscount = Math.max(Number(product?.discount || 0), maxVariantDiscount)
  const toNumberOrNull = (value) => (
    value === null || value === undefined || Number.isNaN(Number(value)) ? null : Number(value)
  )
  const baseStock = toNumberOrNull(product?.stock) ?? 0
  const baseReserved = toNumberOrNull(product?.reserved) ?? 0
  const variantStockTotal = (product?.variants || []).reduce((sum, v) => sum + Number(v?.stock || 0), 0)
  const variantReservedTotal = (product?.variants || []).reduce((sum, v) => sum + Number(v?.reserved || 0), 0)
  const totalStock = toNumberOrNull(product?.totalStock) ?? (baseStock + variantStockTotal)
  const totalReserved = toNumberOrNull(product?.totalReserved) ?? (baseReserved + variantReservedTotal)
  const availableStock = Math.max(0, totalStock - totalReserved)
  const isLowStock = availableStock > 0 && availableStock <= 5
  const isReservedHigh = totalStock > 0
    && totalReserved >= Math.ceil(totalStock * 0.7)
    && availableStock < 5
  const discountedPrice = maxDiscount > 0
    ? Math.round((product?.price || 0) * (1 - maxDiscount / 100))
    : (product?.price || 0)
  const minVariantPrice = Array.isArray(product?.variants) && product.variants.length > 0
    ? product.variants.reduce((min, v) => {
      const price = Number(v?.price || 0)
      if (!Number.isFinite(price) || price <= 0) return min
      return min === null ? price : Math.min(min, price)
    }, null)
    : null
  const displayBasePrice = Number.isFinite(minVariantPrice) && minVariantPrice !== null
    ? minVariantPrice
    : Number(product?.price || 0)
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
  const secondaryImageUrl = React.useMemo(() => {
    const candidates = [
      ...(product.images || []).map((img) => img?.url),
      ...(product.variants || []).map((variant) => variant?.image?.url),
    ].filter((value) => typeof value === 'string' && value.trim().length > 0)
    return candidates.find((value) => value !== primaryImageUrl) || null
  }, [product, primaryImageUrl])

  const galleryImages = React.useMemo(() => {
    const candidates = [
      primaryImageUrl,
      ...(product.images || []).map((img) => img?.url),
      ...(product.variants || []).map((variant) => variant?.image?.url),
    ].filter((value) => typeof value === 'string' && value.trim().length > 0)
    const seen = new Set()
    const unique = []
    candidates.forEach((url) => {
      if (seen.has(url)) return
      seen.add(url)
      unique.push(url)
    })
    return unique
  }, [product, primaryImageUrl])
  const [imageSrc, setImageSrc] = React.useState(primaryImageUrl)

  React.useEffect(() => {
    setImageSrc(primaryImageUrl)
  }, [primaryImageUrl, product?._id])

  React.useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('compareProducts') || '[]')
      const exists = Array.isArray(stored) && stored.some(p => p?._id === product?._id)
      setIsCompared(exists)
    } catch {
      setIsCompared(false)
    }
  }, [product?._id])

  const handleCompare = (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const stored = JSON.parse(localStorage.getItem('compareProducts') || '[]')
      const list = Array.isArray(stored) ? stored.filter(Boolean) : []
      const exists = list.some(p => p?._id === product?._id)
      let next = list
      if (exists) {
        next = list.filter(p => p?._id !== product?._id)
      } else {
        const totalStock = (product?.stock || 0) + (product?.variants?.reduce((s, v) => s + (v?.stock || 0), 0) || 0)
        const snapshot = {
          _id: product._id,
          title: product.title,
          price: product.price,
          discount: product.discount,
          images: product.images,
          avgRating: product.avgRating,
          reviewsCount: product.reviewsCount,
          totalStock,
          variantsCount: product?.variants?.length || 0
        }
        next = [snapshot, ...list].slice(0, 3)
      }
      localStorage.setItem('compareProducts', JSON.stringify(next))
      setIsCompared(!exists)
      window.dispatchEvent(new Event('compare:updated'))
    } catch {
      // ignore
    }
  }

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
        baseProductImage: primaryImageUrl,
        productStock: totalStock,
        qty: 1,
        variant: null,
        productVariants: buildProductVariants(product),
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
        title: 'Wishlist updated'
      })
      return
    }

    try {
      setWishlistLoading(true)
      await toggleWishlist(product._id).unwrap()
      toast({
        title: isWishlisted
          ? 'Removed from wishlist'
          : 'Added to wishlist'
      })
    } catch {
      toast({
        title: 'Something went wrong',
        variant: 'destructive'
      })
    } finally {
      setWishlistLoading(false)
    }
  }

  if (!product) return null

  return (
    <div className="group relative bg-white border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full">
      {/* WISHLIST BUTTON */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleWishlist}
          className={`relative p-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm transition-all duration-300 ${isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-black'
            }`}
        >
          <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
          {wishlistLoading && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-black/80 animate-pulse" />
          )}
        </button>
      </div>

      <div className="absolute top-12 left-4 sm:top-4 z-10">
        <button
          onClick={handleCompare}
          className={`p-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm transition-all duration-300 ${isCompared ? 'text-black' : 'text-gray-400 hover:text-black'}`}
          title={isCompared ? 'Remove from compare' : 'Compare'}
        >
          <Scale size={16} className={isCompared ? 'fill-current' : ''} />
        </button>
      </div>

      {/* PRODUCT IMAGE */}
      <Link to={`/products/${product._id}`} className="block relative aspect-[4/5] sm:aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-amber-50 flex items-center justify-center">
        {/* SALE BADGE */}
        {maxDiscount > 0 && (
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center bg-white text-gray-900 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-md border border-gray-100 sm:px-3 sm:py-1.5 sm:text-[9px] px-2 py-1 text-[8px]">
              Sale <span className="ml-2 text-rose-600">-{maxDiscount}%</span>
            </span>
          </div>
        )}
        {Number(product?.totalReserved || 0) > 0 && (
          <div className="absolute top-14 right-4 z-10">
            <span className="inline-flex items-center bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-amber-100">
              Reserved {product.totalReserved}
            </span>
          </div>
        )}
        {isReservedHigh && (
          <div className="absolute top-24 right-4 z-10">
            <span className="inline-flex items-center bg-rose-50 text-rose-700 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-rose-100">
              High Reserved
            </span>
          </div>
        )}
        {isLowStock && (
          <div className="absolute top-24 left-4 z-10">
            <span className="inline-flex items-center bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-amber-100">
              Only {availableStock} left
            </span>
          </div>
        )}

        <img
          src={imageSrc}
          alt={product.title}
          className={`w-full h-full max-h-full max-w-full object-contain p-2 sm:p-4 transition-all duration-700 ${secondaryImageUrl ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
          onError={() => {
            if (imageSrc !== '/placeholder.png') setImageSrc('/placeholder.png')
          }}
        />
        {secondaryImageUrl && (
          <img
            src={secondaryImageUrl}
            alt={`${product.title} alternate`}
            className="absolute inset-0 w-full h-full max-h-full max-w-full object-contain p-2 sm:p-4 opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105"
          />
        )}

        {/* QUICK ADD OVERLAY */}
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className="w-full bg-white/95 backdrop-blur-md text-black hover:bg-black hover:text-white border-0 shadow-lg text-xs font-bold uppercase tracking-wider h-12 sm:h-11"
          >
            {isAdding ? 'Adding...' : (isOutOfStock ? 'Sold Out' : 'Quick Add')}
          </Button>
        </div>
      </Link>

      <div className="px-3 sm:px-5 pb-3 min-h-[44px]">
        {galleryImages.length > 1 ? (
          <div className="flex items-center gap-2 overflow-hidden">
            {galleryImages.slice(0, 5).map((url, idx) => (
              <div key={`${product._id}-thumb-${idx}`} className="w-8 h-8 rounded-md border border-gray-100 bg-gray-50 overflow-hidden flex-shrink-0">
                <img src={url} alt="" className="w-full h-full object-contain" />
              </div>
            ))}
            {galleryImages.length > 5 && (
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                +{galleryImages.length - 5}
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* PRODUCT INFO */}
      <div className="p-3 sm:p-5 space-y-2 flex-1 min-h-[88px]">
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start sm:gap-2 min-w-0">
          <Link to={`/products/${product._id}`} className="flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 break-words group-hover:text-primary transition-colors min-w-0">
              {product.title}
            </h3>
          </Link>
          <PriceDisplay price={displayBasePrice} discount={maxDiscount} className="shrink-0 sm:text-right" />
        </div>

        <div className="flex items-center gap-1 pt-1">
          <StarRating rating={product.avgRating} size={14} />
        </div>
      </div>
    </div>
  )
}
