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

const getContrastYIQ = (hex) => {
  if (!hex) return '#ffffff';
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
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
  const [purchaseMode, setPurchaseMode] = React.useState('base') // 'base' or 'variant'
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

  // Robust Category Detection
  const isElectronics =
    product?.category?.name?.toLowerCase().includes('electronic') ||
    (typeof product?.category === 'string' && product?.category?.toLowerCase().includes('electronic'))

  const isGrocery =
    product?.category?.name?.toLowerCase().includes('groc') ||
    (typeof product?.category === 'string' && product?.category?.toLowerCase().includes('groc'))

  const sizeLabel = isElectronics
    ? 'Specifications'
    : (clothingType ? (CLOTHING_SIZE_LABELS[clothingType] || 'Size') : 'Size')

  // ---- Color meta helpers ----
  const baseColor = product?.color
  const baseColorHex = resolveHex(baseColor)
  const baseColorName = baseColor?.name || (typeof baseColor === 'string' ? baseColor : null)

  const getColorMeta = (rawColor) => {
    if (!rawColor) return { key: 'no-color', name: '', hex: null }

    // Handle standard legacy string colors
    if (typeof rawColor === 'string') {
      const isHex = rawColor.startsWith('#')
      return {
        key: rawColor,
        name: isHex ? 'Custom Color' : rawColor,
        hex: isHex ? rawColor : null
      }
    }

    // Handle populated DB objects
    const key = rawColor._id || rawColor.name || 'color'
    let name = rawColor.name || ''

    // If the name in the DB was accidentally saved as a raw hex code, override it
    if (name.startsWith('#')) {
      name = 'Custom Color'
    } else if (!name && rawColor.hex) {
      name = 'Custom Color'
    }

    return { key, name, hex: rawColor.hex || null }
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

  // Auto-select first color ONLY if we are in variant mode
  React.useEffect(() => {
    if (purchaseMode === 'variant' && !selectedColorKey && variantColorOptions.length > 0) {
      const firstColor = variantColorOptions[0]
      setSelectedColorKey(firstColor.key)
      const sizes = variantSizesByColor.get(firstColor.key) || []
      if (sizes.length > 0 && !selectedSize) setSelectedSize(sizes[0])
    }
  }, [product, variantColorOptions, purchaseMode]) // Removed purchaseMode, selectedColorKey from deps conceptually - only run when product/variants change and we have NO selection

  // Auto-select first base size
  React.useEffect(() => {
    if (!product || variants.length > 0) {
      // Only force base mode if there are NO variants at all
      if (product && variants.length === 0 && purchaseMode !== 'base') {
        setPurchaseMode('base')
      }
      return
    }
    if (mainSizes.length > 0 && !selectedBaseSize) setSelectedBaseSize(mainSizes[0])
  }, [product, mainSizes, variants.length])

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
        selectedVariant.options?.size || ''
      ].filter(Boolean).join(' / ')
      : selectedBaseSize || 'Base Product'

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

          <p className="text-gray-600 text-sm leading-relaxed max-w-md relative z-10">
            {product.description}
          </p>

          {/* ─── PURCHASE MODE TOGGLE ─── */}
          {hasVariants && (mainSizes.length > 0 || !product.sizes?.length) && (
            <div className="pt-2 relative z-20 bg-transparent">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">
                Purchase Options
              </p>
              <div className="flex bg-slate-100/50 backdrop-blur-sm p-1.5 rounded-2xl w-fit relative border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setPurchaseMode('base')}
                  className={`relative z-10 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${purchaseMode === 'base' ? 'shadow-lg scale-100' : 'text-gray-400 hover:text-gray-600 scale-95 opacity-70'}`}
                  style={purchaseMode === 'base' ? {
                    backgroundColor: baseColorHex || '#000000',
                    color: getContrastYIQ(baseColorHex || '#000000')
                  } : {}}
                >
                  Main Product
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseMode('variant')}
                  className={`relative z-10 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${purchaseMode === 'variant' ? 'bg-white shadow-sm text-black scale-100' : 'text-gray-400 hover:text-gray-600 scale-95 opacity-70'}`}
                >
                  Variants
                </button>
              </div>
            </div>
          )}

          <div className="relative z-10 bg-transparent min-h-[120px] pb-4 px-1 -mx-1 overflow-hidden sm:overflow-visible">
            {/* ─── VARIANT SELECTOR ─── */}
            {hasVariants && purchaseMode === 'variant' && (
              <div key="variant-selector" className="space-y-6 pt-6 border-t border-slate-100 bg-transparent animate-in fade-in slide-in-from-top-4 duration-300">
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
                    <div className="flex flex-wrap gap-4 px-1 pb-1">
                      {variantColorOptions.map(c => {
                        const isSelected = selectedColorKey === c.key
                        return (
                          <button
                            key={`color-${c.key}`}
                            type="button"
                            onClick={() => {
                              setSelectedColorKey(c.key)
                              const sizes = variantSizesByColor.get(c.key) || []
                              setSelectedSize(sizes.length > 0 ? sizes[0] : '')
                            }}
                            title={c.name}
                            className={`w-10 h-10 rounded-full border-[3px] transition-all flex items-center justify-center shadow-md hover:scale-110 active:scale-95 overflow-hidden ${isSelected ? 'scale-110' : 'border-gray-200'}`}
                            style={{
                              backgroundColor: c.hex || '#e5e7eb',
                              borderColor: isSelected ? (c.hex && (c.hex.toLowerCase() === '#ffffff' || c.hex.toLowerCase() === '#fff') ? '#111' : (c.hex || '#111')) : (c.hex && (c.hex.toLowerCase() === '#ffffff' || c.hex.toLowerCase() === '#fff') ? '#d1d5db' : '#e5e7eb'),
                              outline: isSelected ? `3px solid ${c.hex && (c.hex.toLowerCase() === '#ffffff' || c.hex.toLowerCase() === '#fff') ? '#111' : (c.hex || '#111')}` : 'none',
                              outlineOffset: '2px'
                            }}
                          >
                            <span
                              className="text-[8px] font-black uppercase leading-tight text-center px-1 drop-shadow-md z-10"
                              style={{
                                color: c.hex ? getContrastYIQ(c.hex) : '#fff',
                                textShadow: c.hex && getContrastYIQ(c.hex) === '#000000' ? '0 1px 2px rgba(255,255,255,0.8)' : '0 1px 2px rgba(0,0,0,0.8)'
                              }}
                            >
                              {!c.hex && (c.name?.startsWith('#') ? 'EXT' : c.name?.slice(0, 4))}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* SIZE SELECTOR */}
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
                            type="button"
                            onClick={() => !isOOS && setSelectedSize(size)}
                            disabled={isOOS}
                            className={`relative px-4 py-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center min-w-[70px] ${isOOS ? 'opacity-50 bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400' : 'hover:scale-105 active:scale-95 text-slate-700 bg-white border-gray-200'}`}
                            style={(!isOOS && isSelected)
                              ? { backgroundColor: activeHex, color: getContrastYIQ(activeHex), borderColor: activeHex === '#ffffff' ? '#e5e7eb' : activeHex }
                              : undefined
                            }
                          >
                            <span className={`text-[11px] font-black uppercase tracking-widest ${isOOS ? 'line-through' : ''}`}>{size}</span>
                            {!isOOS && (
                              <span className="text-[8px] mt-0.5 opacity-80 lowercase tracking-wider font-semibold">
                                {stockCount} left
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

            {/* ─── BASE PRODUCT SIZES ─── */}
            {(purchaseMode === 'base' || !hasVariants) && (
              <div key="base-selector" className="pt-4 border-t border-slate-100 bg-transparent">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                  {mainSizes.length > 0 ? sizeLabel : (isElectronics ? 'Specifications' : 'Product Info')}
                  {selectedBaseSize && mainSizes.length > 0 && (
                    <span className="ml-2 text-gray-600 normal-case font-bold">— {selectedBaseSize}</span>
                  )}
                </p>
                {mainSizes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {mainSizes.map(size => {
                      const isSelected = selectedBaseSize === size
                      const activeHex = baseColorHex || '#111'
                      return (
                        <button
                          key={`bsize-${size}`}
                          type="button"
                          onClick={() => setSelectedBaseSize(size)}
                          className="px-4 py-2 rounded-xl border-2 text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                          style={isSelected
                            ? { backgroundColor: activeHex, color: getContrastYIQ(activeHex), borderColor: activeHex === '#ffffff' ? '#e5e7eb' : activeHex }
                            : { backgroundColor: 'transparent', color: '#374151', borderColor: '#e5e7eb' }
                          }
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-slate-50/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 transition-all">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                        {isGrocery ? 'Fresh Stock' : isElectronics ? 'Original Design' : 'Standard Edition'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">
                        {isGrocery ? 'Quality Assured' : isElectronics ? 'Certified Product' : 'Authentic Item'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
              <div className="flex items-center bg-gray-100 rounded-xl px-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center font-bold hover:text-primary transition-colors disabled:opacity-20"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="w-10 text-center font-black text-sm">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  className="w-10 h-10 flex items-center justify-center font-bold hover:text-primary transition-colors disabled:opacity-20"
                  disabled={quantity >= currentStock}
                >
                  +
                </button>
              </div>

              <Button
                type="button"
                onClick={handleAddToCart}
                disabled={currentStock < 1 || isAdding}
                className="flex-1 h-12 bg-black hover:bg-slate-800 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
              >
                {isAdding ? 'Adding to cart...' : (currentStock > 0 ? 'Add to Bag' : 'Sold Out')}
              </Button>

              <button
                type="button"
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
