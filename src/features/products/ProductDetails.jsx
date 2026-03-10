import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetProductQuery, useGetReviewsQuery } from './productApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { addGuestCart } from '../cart/cartSlice'
import { toggleGuestWishlist } from '../wishlist/wishlistSlice'
import { setCart } from '../cart/cartSlice'
import * as cartApi from '../cart/cartApi'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import ReviewForm from './ReviewForm'
import ReviewList from './ReviewList'
import {
  useToggleWishlistMutation,
  useGetWishlistQuery
} from '../wishlist/wishlistApi'
import StarRating from './StarRating'
import { Heart } from 'lucide-react'
import PriceDisplay from '@/components/PriceDisplay'
import ReviewSummary from './ReviewSummary'


const getImageUrl = (img) => {
  if (!img) return ''
  if (typeof img === 'string') return img
  return img.url || ''
}

const CLOTHING_SIZE_LABELS = {
  clothes: 'Clothing Size',
  shoes: 'Shoe Size',
  bags: 'Bag Size',
  eyeglass: 'Frame Size'
}

// Build a hex color for button styling; fallback to #111 (near-black)
const resolveHex = (rawColor) => {
  if (!rawColor) return null
  if (typeof rawColor === 'object' && rawColor.hex) return rawColor.hex
  return null
}

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const user = useAppSelector(state => state.auth.user)

  const { data, isLoading, refetch } = useGetProductQuery(id)
  const product = data?.product

  const {
    data: reviewsData,
    refetch: refetchReviews,
    isLoading: isReviewsLoading,
    isError: isReviewsError,
    error: reviewsError
  } = useGetReviewsQuery(id)

  React.useEffect(() => {
    const timer = setInterval(() => { refetch() }, 3000)
    return () => clearInterval(timer)
  }, [refetch])

  const reviews = reviewsData?.reviews || []

  const { data: wishlistData } = useGetWishlistQuery()
  const wishlistItems = wishlistData?.wishlist || []
  const [toggleWishlist] = useToggleWishlistMutation()

  /* ================= STATE ================= */
  const [mainImage, setMainImage] = React.useState('')
  const [purchaseMode, setPurchaseMode] = React.useState('variant') // 'variant' or 'base'
  const [selectedVariantIndex, setSelectedVariantIndex] = React.useState(-1)
  const [selectedBaseSize, setSelectedBaseSize] = React.useState('')
  const [selectedColorKey, setSelectedColorKey] = React.useState('')
  const [selectedSize, setSelectedSize] = React.useState('')
  const [quantity, setQuantity] = React.useState(1)
  const [isAdding, setIsAdding] = React.useState(false)

  const variants = product?.variants || []
  const selectedVariant = selectedVariantIndex >= 0 ? variants[selectedVariantIndex] : null

  // ---- Clothing type & sizes ----
  const clothingType = product?.clothingType || null
  const isClothingProduct = !!clothingType

  // Main product sizes (from product.sizes or tags fallback)
  const BASE_SIZE_TAG_PREFIX = '__base_sizes:'
  const parseBaseSizesFromTags = (rawTags = []) => {
    const marker = (rawTags || []).find(t => typeof t === 'string' && t.startsWith(BASE_SIZE_TAG_PREFIX))
    if (!marker) return []
    return marker.slice(BASE_SIZE_TAG_PREFIX.length).split('|').map(s => s.trim()).filter(Boolean)
  }
  const mainSizes = Array.isArray(product?.sizes) && product.sizes.length > 0
    ? product.sizes
    : parseBaseSizesFromTags(product?.tags || [])

  // ---- Color meta helpers ----
  const baseColor = product?.color
  const baseColorHex = resolveHex(baseColor)
  const baseColorName = baseColor?.name || (typeof baseColor === 'string' ? baseColor : null)

  const getColorMeta = (rawColor) => {
    if (!rawColor) return { key: 'no-color', name: '', hex: null }
    if (typeof rawColor === 'string') return { key: rawColor, name: rawColor, hex: null }
    const key = rawColor._id || rawColor.name || 'color'
    return { key, name: rawColor.name || '', hex: rawColor.hex || null }
  }

  // ---- Variant color options (deduplicated) ----
  const variantColorOptions = React.useMemo(() => {
    const map = new Map()
    variants.forEach(v => {
      const meta = getColorMeta(v.options?.color)
      if (!map.has(meta.key)) map.set(meta.key, meta)
    })
    return Array.from(map.values())
  }, [variants])

  // ---- Sizes available per color ----
  const variantSizesByColor = React.useMemo(() => {
    const map = new Map()
    variants.forEach(v => {
      const meta = getColorMeta(v.options?.color)
      const size = v.options?.size
      if (!map.has(meta.key)) map.set(meta.key, [])
      if (size && !map.get(meta.key).includes(size)) map.get(meta.key).push(size)
    })
    return map
  }, [variants])

  const availableVariantSizes = selectedColorKey && variantSizesByColor.has(selectedColorKey)
    ? variantSizesByColor.get(selectedColorKey)
    : Array.from(new Set(Array.from(variantSizesByColor.values()).flat()))

  // ---- Selected variant color hex (for button styling) ----
  const selectedVariantColorHex = React.useMemo(() => {
    if (selectedColorKey) {
      const meta = variantColorOptions.find(c => c.key === selectedColorKey)
      if (meta?.hex) return meta.hex
    }
    if (selectedVariant) return resolveHex(selectedVariant.options?.color)
    return null
  }, [selectedColorKey, selectedVariant, variantColorOptions])

  /* ================= EFFECTS ================= */
  React.useEffect(() => {
    if (product && !mainImage) {
      setMainImage(product.images?.[0]?.url || '')
    }
  }, [product, mainImage])

  // Sync image with purchaseMode and selectedVariant
  React.useEffect(() => {
    if (purchaseMode === 'base') {
      if (product?.images?.[0]?.url) setMainImage(product.images[0].url)
    } else {
      if (selectedVariant?.image?.url) {
        setMainImage(selectedVariant.image.url)
      } else if (product?.images?.[0]?.url) {
        setMainImage(product.images[0].url)
      }
    }
  }, [purchaseMode, product, selectedVariant])

  // Auto-select first color when product loads
  React.useEffect(() => {
    if (!product) return
    if (variants.length > 0) {
      setPurchaseMode('variant')
      if (!selectedColorKey && variantColorOptions.length > 0) {
        const firstColor = variantColorOptions[0]
        setSelectedColorKey(firstColor.key)
        const sizes = variantSizesByColor.get(firstColor.key) || []
        if (sizes.length > 0 && !selectedSize) setSelectedSize(sizes[0])
      }
    } else {
      setPurchaseMode('base')
    }
  }, [product, variantColorOptions])

  // Auto-select first base size
  React.useEffect(() => {
    if (!product || variants.length > 0) return
    if (mainSizes.length > 0 && !selectedBaseSize) setSelectedBaseSize(mainSizes[0])
  }, [product, mainSizes])

  // Sync selectedVariantIndex from color+size
  React.useEffect(() => {
    if (variants.length === 0) return
    if (!selectedColorKey && !selectedSize) return
    const idx = variants.findIndex(v => {
      const meta = getColorMeta(v.options?.color)
      const colorMatch = selectedColorKey ? meta.key === selectedColorKey : true
      const sizeMatch = selectedSize ? (v.options?.size || '') === selectedSize : true
      return colorMatch && sizeMatch
    })
    if (idx >= 0) {
      setSelectedVariantIndex(idx)
      if (variants[idx]?.image?.url) setMainImage(variants[idx].image.url)
    } else {
      // Color selected but no size match yet; find the row by color alone for image
      const colorIdx = variants.findIndex(v => getColorMeta(v.options?.color).key === selectedColorKey)
      if (colorIdx >= 0 && variants[colorIdx]?.image?.url) setMainImage(variants[colorIdx].image.url)
      setSelectedVariantIndex(-1)
    }
  }, [selectedColorKey, selectedSize, variants])

  /* ================= LOADING / NOT FOUND ================= */
  if (isLoading) return (
    <div className="p-6 flex flex-col md:flex-row gap-6 animate-pulse max-w-7xl mx-auto">
      <div className="md:w-1/2 space-y-4">
        <div className="w-full h-96 bg-gray-200 rounded" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-20 sm:h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
      <div className="md:w-1/2 space-y-4">
        <div className="h-10 bg-gray-200 rounded w-3/4" />
        <div className="h-6 bg-gray-200 rounded w-1/4" />
        <div className="h-24 bg-gray-200 rounded w-full mt-4" />
        <div className="h-32 bg-gray-100 rounded-md p-4 mt-6 border" />
        <div className="flex gap-4 mt-6">
          <div className="h-10 bg-gray-200 rounded w-32" />
          <div className="h-10 bg-gray-200 rounded w-32" />
        </div>
      </div>
    </div>
  )
  if (!product) return <p>Product not found</p>

  /* ================= LOGIC ================= */
  const isInWishlist = wishlistItems.some(
    id => id.toString() === product._id.toString() || id?.productId === product._id
  )

  const effectiveVariant = purchaseMode === 'variant' ? selectedVariant : null
  const currentStock = effectiveVariant ? effectiveVariant.stock : (product.stock ?? 0)
  const currentPrice = effectiveVariant ? effectiveVariant.price : (product.price ?? 0)
  const currentDiscount = Number(effectiveVariant?.discount ?? product.discount ?? 0)
  const discountedCurrentPrice = currentDiscount > 0
    ? Math.round((currentPrice || 0) * (1 - currentDiscount / 100))
    : (currentPrice || 0)

  const hasVariants = variants.length > 0
  const sizeLabel = clothingType ? (CLOTHING_SIZE_LABELS[clothingType] || 'Size') : 'Size'

  /* ================= ADD TO CART ================= */
  const handleAddToCart = async () => {
    // Validation
    if (purchaseMode === 'variant' && hasVariants) {
      if (!selectedColorKey) {
        toast({ title: 'Please select a color', variant: 'destructive' })
        return
      }
      if (availableVariantSizes.length > 0 && !selectedSize) {
        toast({ title: `Please select a ${sizeLabel.toLowerCase()}`, variant: 'destructive' })
        return
      }
      if (selectedVariantIndex < 0) {
        toast({ title: 'Please select a valid color & size combination', variant: 'destructive' })
        return
      }
    } else if (purchaseMode === 'base' || !hasVariants) {
      if (mainSizes.length > 0 && !selectedBaseSize) {
        toast({ title: `Please select a ${sizeLabel.toLowerCase()} for the base product`, variant: 'destructive' })
        return
      }
    }

    const variantPayload = (purchaseMode === 'variant' && selectedVariant)
      ? {
        _id: selectedVariant._id,
        sku: selectedVariant.sku,
        size: selectedVariant.options?.size || selectedSize || undefined,
        color: selectedVariant.options?.color?.name || selectedVariant.options?.color?._id || selectedVariant.options?.color || undefined
      }
      : (selectedBaseSize ? { size: selectedBaseSize } : null)

    const variantLabel = (purchaseMode === 'variant' && selectedVariant)
      ? [
        selectedVariant.options?.color?.name || '',
        selectedVariant.options?.size ? `${sizeLabel}: ${selectedVariant.options.size}` : ''
      ].filter(Boolean).join(' / ')
      : selectedBaseSize ? `${sizeLabel}: ${selectedBaseSize}` : 'Base Product'

    if (!user) {
      dispatch(addGuestCart({
        productId: product._id,
        title: product.title,
        price: discountedCurrentPrice,
        basePrice: currentPrice,
        discount: currentDiscount,
        productImage: mainImage,
        productStock: product.stock ?? 0,
        qty: quantity,
        variant: variantPayload || null,
        variantLabel,
        variantStock: selectedVariant?.stock,
        clothingType,
        addedAt: new Date().toISOString(),
        key: `${product._id}-${variantPayload?.sku || variantPayload?.size || selectedBaseSize || 'default'}`
      }))
      toast({ title: 'Added to cart (Guest)' })
      navigate('/cart')
      return
    }

    if (currentStock < quantity) {
      toast({ title: 'Not enough stock', variant: 'destructive' })
      return
    }

    setIsAdding(true)
    try {
      const updatedCart = await cartApi.addToCart(product._id, quantity, variantPayload)
      dispatch(setCart(updatedCart))
      toast({ title: 'Added to Cart' })
      navigate('/cart')
    } catch (err) {
      console.error('Add to cart failed:', err)
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to add to cart',
        variant: 'destructive'
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleWishlistToggle = async () => {
    if (!user) {
      dispatch(toggleGuestWishlist(product._id))
      toast({ title: 'Wishlist updated (Guest)' })
      return
    }
    const result = await toggleWishlist(product._id).unwrap()
    toast({ title: result.message || 'Wishlist updated' })
  }

  const imageList = [
    ...(product.images?.length ? [product.images[0]] : []),
    ...variants.map(v => v.image).filter(img => img && img.url),
    ...(product.images?.slice(1) || [])
  ]

  /* ================= RENDER ================= */
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-14 lg:space-y-12">
      <div className="flex flex-col lg:flex-row gap-12 xl:gap-16">

        {/* ── IMAGES COLUMN ── */}
        <div className="lg:w-1/2 xl:w-[52%] space-y-6">
          <div className="aspect-[4/5] max-h-[560px] bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm group">
            <img
              src={getImageUrl(mainImage)}
              alt={product.title}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
            {imageList.map((img, idx) => {
              const url = getImageUrl(img)
              if (!url) return null
              const isActive = getImageUrl(mainImage) === url
              return (
                <div
                  key={idx}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${isActive ? 'border-black' : 'border-transparent hover:border-gray-200'}`}
                  onClick={() => setMainImage(url)}
                >
                  <img src={url} className="w-full h-full object-cover" />
                </div>
              )
            })}
          </div>
        </div>

        {/* ── DETAILS COLUMN ── */}
        <div className="lg:w-1/2 xl:w-[48%] space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              <span>{product.brand?.name || 'ShopLuxe Original'}</span>
              <span>•</span>
              <StarRating rating={product.avgRating} size={14} />
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none">
              {product.title}
            </h1>

            <div className="flex items-center justify-between pt-2">
              <PriceDisplay price={currentPrice} discount={currentDiscount} className="text-4xl" />
              {currentDiscount > 0 && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-red-100 shadow-sm animate-pulse">
                  Sale -{currentDiscount}%
                </div>
              )}
            </div>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed max-w-md">
            {product.description}
          </p>

          {/* ─── PURCHASE MODE TOGGLE ─── */}
          {hasVariants && (mainSizes.length > 0 || !product.sizes?.length) && (
            <div className="flex bg-gray-100 p-1 rounded-xl w-fit mt-4 flex-wrap">
              <button
                onClick={() => setPurchaseMode('base')}
                className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${purchaseMode === 'base' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Buy Base Product
              </button>
              <button
                onClick={() => setPurchaseMode('variant')}
                className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${purchaseMode === 'variant' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Buy Variant
              </button>
            </div>
          )}

          {/* ─── VARIANT SELECTOR (products WITH variants) ─── */}
          {hasVariants && purchaseMode === 'variant' && (
            <div className="space-y-5 pt-4 border-t border-gray-100">

              {/* COLOR SELECTOR */}
              {variantColorOptions.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                    Color
                    {selectedColorKey && (
                      <span className="ml-2 text-gray-600 normal-case font-bold">
                        — {variantColorOptions.find(c => c.key === selectedColorKey)?.name || ''}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {variantColorOptions.map(c => {
                      const isSelected = selectedColorKey === c.key
                      return (
                        <button
                          key={`color-${c.key}`}
                          onClick={() => {
                            setSelectedColorKey(c.key)
                            const sizes = variantSizesByColor.get(c.key) || []
                            setSelectedSize(sizes.length > 0 ? sizes[0] : '')
                          }}
                          title={c.name}
                          className={`w-9 h-9 rounded-full border-[3px] transition-all flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 ${isSelected ? 'scale-110' : 'border-transparent'
                            }`}
                          style={{
                            backgroundColor: c.hex || '#e5e7eb',
                            borderColor: isSelected ? (c.hex || '#111') : 'transparent',
                            outline: isSelected ? `3px solid ${c.hex || '#111'}` : 'none',
                            outlineOffset: '2px'
                          }}
                        >
                          {!c.hex && (
                            <span className="text-[7px] font-black uppercase text-gray-600 leading-none">
                              {c.name?.slice(0, 3)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* SIZE SELECTOR (variant sizes) */}
              {availableVariantSizes.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                    {sizeLabel}
                    {selectedSize && (
                      <span className="ml-2 text-gray-600 normal-case font-bold">— {selectedSize}</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableVariantSizes.map(size => {
                      const isSelected = selectedSize === size
                      const activeHex = selectedVariantColorHex || '#111'

                      const variantForStock = variants.find(v => getColorMeta(v.options?.color).key === selectedColorKey && (v.options?.size || '') === size)
                      const stockCount = variantForStock ? (variantForStock.stock ?? 0) : 0
                      const isOOS = stockCount <= 0

                      return (
                        <button
                          key={`vsize-${size}`}
                          onClick={() => !isOOS && setSelectedSize(size)}
                          disabled={isOOS}
                          className={`relative px-4 py-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center min-w-[70px] ${isOOS ? 'opacity-50 bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400' : 'hover:scale-105 active:scale-95 text-slate-700 bg-white border-gray-200'}`}
                          style={(!isOOS && isSelected)
                            ? { backgroundColor: activeHex, color: '#fff', borderColor: activeHex }
                            : undefined
                          }
                        >
                          <span className={`text-[11px] font-black uppercase tracking-widest ${isOOS ? 'line-through' : ''}`}>{size}</span>
                          {!isOOS && (
                            <span className="text-[8px] mt-0.5 opacity-80 lowercase tracking-wider font-semibold">
                              {stockCount} left
                            </span>
                          )}
                          {isOOS && (
                            <span className="text-[8px] mt-0.5 opacity-80 uppercase tracking-wider font-bold">
                              Out
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── BASE PRODUCT SIZES (no variants OR base product selection) ─── */}
          {(purchaseMode === 'base' || !hasVariants) && mainSizes.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                {sizeLabel}
                {selectedBaseSize && (
                  <span className="ml-2 text-gray-600 normal-case font-bold">— {selectedBaseSize}</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {mainSizes.map(size => {
                  const isSelected = selectedBaseSize === size
                  const activeHex = baseColorHex || '#111'
                  return (
                    <button
                      key={`bsize-${size}`}
                      onClick={() => setSelectedBaseSize(size)}
                      className="px-4 py-2 rounded-xl border-2 text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                      style={isSelected
                        ? { backgroundColor: activeHex, color: '#fff', borderColor: activeHex }
                        : { backgroundColor: '#fff', color: '#374151', borderColor: '#e5e7eb' }
                      }
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── INVENTORY STATUS ─── */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${currentStock > 0 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {currentStock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              {currentStock > 0 && (
                <span className="text-[10px] font-black text-slate-900 border-l border-slate-200 pl-4 uppercase tracking-widest">
                  {currentStock} units ready
                </span>
              )}
            </div>
          </div>

          {/* ─── PURCHASE ACTIONS ─── */}
          <div className="space-y-4">
            <div className="flex gap-4">
              {/* QTY STEPPER */}
              <div className="flex items-center bg-gray-100 rounded-xl px-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center font-bold hover:text-primary transition-colors disabled:opacity-20"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="w-10 text-center font-black text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  className="w-10 h-10 flex items-center justify-center font-bold hover:text-primary transition-colors disabled:opacity-20"
                  disabled={quantity >= currentStock}
                >
                  +
                </button>
              </div>

              {/* ADD TO BAG */}
              <Button
                onClick={handleAddToCart}
                disabled={currentStock < 1 || isAdding}
                className="flex-1 h-12 bg-black hover:bg-slate-800 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
              >
                {isAdding ? 'Adding to cart...' : (currentStock > 0 ? 'Add to Bag' : 'Sold Out')}
              </Button>

              {/* WISHLIST */}
              <button
                onClick={handleWishlistToggle}
                className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all ${isInWishlist ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-gray-100 hover:border-gray-900'}`}
              >
                <Heart size={20} className={isInWishlist ? 'fill-current' : ''} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── REVIEWS ─── */}
      <div className="pt-10 lg:pt-8 border-t border-gray-100 space-y-10 lg:space-y-8">
        <section>
          <h2 className="text-2xl font-black tracking-tighter uppercase mb-5 lg:mb-4">Customer Reviews</h2>
          {isReviewsLoading ? (
            <div className="grid md:grid-cols-2 gap-12 py-10 border-y border-gray-100 animate-pulse">
              <div className="h-32 bg-gray-100 rounded-2xl" />
              <div className="h-32 bg-gray-100 rounded-2xl" />
            </div>
          ) : isReviewsError ? (
            <div className="py-8 px-5 rounded-2xl border border-red-100 bg-red-50 text-sm text-red-700 flex items-center justify-between gap-4">
              <span>{reviewsError?.data?.message || 'Failed to load reviews.'}</span>
              <Button variant="outline" className="rounded-xl border-red-200" onClick={refetchReviews}>Retry</Button>
            </div>
          ) : (
            <ReviewSummary
              reviews={reviews}
              avgRating={product.avgRating || 0}
              reviewsCount={product.reviewsCount || 0}
            />
          )}
        </section>

        <section className="grid lg:grid-cols-3 gap-8 xl:gap-10">
          <div className="lg:col-span-2 min-w-0">
            {isReviewsLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-20 bg-gray-100 rounded-2xl" />
                <div className="h-20 bg-gray-100 rounded-2xl" />
                <div className="h-20 bg-gray-100 rounded-2xl" />
              </div>
            ) : !isReviewsError ? (
              <ReviewList reviews={reviews} productId={product._id} onRefetch={refetchReviews} />
            ) : null}
          </div>
          <div className="bg-gray-50 p-6 lg:p-7 rounded-3xl h-fit lg:sticky lg:top-24">
            <ReviewForm productId={product._id} onSuccess={refetchReviews} user={user} />
          </div>
        </section>
      </div>
    </div>
  )
}
