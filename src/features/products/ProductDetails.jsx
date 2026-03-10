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
import { Heart, CheckCircle2 } from 'lucide-react'
import PriceDisplay from '@/components/PriceDisplay'
import ReviewSummary from './ReviewSummary'

/* ================= IMAGE HELPER ================= */
const getImageUrl = (img) => {
  if (!img) return ''
  if (typeof img === 'string') return img
  return img.url || ''
}

export default function ProductDetails() {
  const BASE_SIZE_TAG_PREFIX = '__base_sizes:'
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
  } =
    useGetReviewsQuery(id)
  React.useEffect(() => {
    const timer = setInterval(() => {
      refetch()
    }, 3000)

    return () => clearInterval(timer)
  }, [refetch])
  const reviews = reviewsData?.reviews || []

  const { data: wishlistData } = useGetWishlistQuery()
  const wishlistItems = wishlistData?.wishlist || []
  const [toggleWishlist] = useToggleWishlistMutation()

  /* ================= STATE ================= */
  const [mainImage, setMainImage] = React.useState('')
  const [selectedVariantIndex, setSelectedVariantIndex] = React.useState(-1) // -1 means base product
  const [selectedBaseSize, setSelectedBaseSize] = React.useState('')
  const [selectedBaseColor, setSelectedBaseColor] = React.useState('')
  const [selectedColorKey, setSelectedColorKey] = React.useState('')
  const [selectedSize, setSelectedSize] = React.useState('')
  const [quantity, setQuantity] = React.useState(1)
  const [isAdding, setIsAdding] = React.useState(false)

  const variants = product?.variants || []
  const selectedVariant = selectedVariantIndex >= 0 ? variants[selectedVariantIndex] : null
  const parseBaseSizesFromTags = (rawTags = []) => {
    const marker = (rawTags || []).find(t => typeof t === 'string' && t.startsWith(BASE_SIZE_TAG_PREFIX))
    if (!marker) return []
    return marker
      .slice(BASE_SIZE_TAG_PREFIX.length)
      .split('|')
      .map(s => s.trim())
      .filter(Boolean)
  }
  // Show only explicitly selected/saved base sizes from ProductForm.
  // Do not auto-fill with all standard options here.
  const mainSizes = Array.isArray(product?.sizes) && product.sizes.length > 0
    ? product.sizes
    : parseBaseSizesFromTags(product?.tags || [])

  const baseColor = product?.color
  const isObjectIdLike = (v) => typeof v === 'string' && /^[a-f0-9]{24}$/i.test(v)
  const baseColorMeta = baseColor
    ? (typeof baseColor === 'string'
      ? { key: baseColor, name: isObjectIdLike(baseColor) ? 'Color' : baseColor, hex: null }
      : { key: baseColor._id || baseColor.name || 'base-color', name: baseColor.name || 'Color', hex: baseColor.hex || null })
    : null
  const getColorMeta = (rawColor) => {
    if (!rawColor) return { key: 'no-color', name: 'No Color', hex: null, raw: rawColor }
    if (typeof rawColor === 'string') {
      return { key: rawColor, name: rawColor, hex: null, raw: rawColor }
    }
    const key = rawColor._id || rawColor.name || 'color'
    return { key, name: rawColor.name || 'Color', hex: rawColor.hex || null, raw: rawColor }
  }

  const variantColorOptions = React.useMemo(() => {
    const map = new Map()
    variants.forEach(v => {
      const meta = getColorMeta(v.options?.color)
      if (!map.has(meta.key)) map.set(meta.key, meta)
    })
    return Array.from(map.values())
  }, [variants])

  const variantSizesByColor = React.useMemo(() => {
    const map = new Map()
    variants.forEach(v => {
      const meta = getColorMeta(v.options?.color)
      const size = v.options?.size
      const sizes = Array.isArray(size) ? size : (size ? [size] : [])
      if (!map.has(meta.key)) map.set(meta.key, new Set())
      sizes.forEach(s => map.get(meta.key).add(s))
    })
    return map
  }, [variants])

  const availableVariantSizes = selectedColorKey && variantSizesByColor.has(selectedColorKey)
    ? Array.from(variantSizesByColor.get(selectedColorKey))
    : Array.from(new Set(Array.from(variantSizesByColor.values()).flatMap(set => Array.from(set))))

  /* ================= EFFECTS (ALWAYS BEFORE RETURN) ================= */
  React.useEffect(() => {
    if (product && !mainImage) {
      setMainImage(product.images?.[0]?.url || '')
    }
  }, [product, mainImage])

  React.useEffect(() => {
    if (!product) return
    if (variants.length > 0) {
      const first = variants[0]
      const meta = getColorMeta(first.options?.color)
      if (!selectedColorKey) setSelectedColorKey(meta.key)
      if (!selectedSize && first.options?.size) setSelectedSize(first.options.size)
    } else {
      setSelectedVariantIndex(-1)
      if (mainSizes.length > 0 && !selectedBaseSize) setSelectedBaseSize(mainSizes[0])
      if (baseColorMeta && !selectedBaseColor) setSelectedBaseColor(baseColorMeta.name || baseColorMeta.key)
    }
  }, [product, variants, mainSizes, selectedColorKey, selectedSize, selectedBaseSize, baseColorMeta, selectedBaseColor])

  React.useEffect(() => {
    if (availableVariantSizes.length === 0) return
    if (selectedSize && !availableVariantSizes.includes(selectedSize)) {
      setSelectedSize('')
    }
  }, [availableVariantSizes, selectedSize])

  React.useEffect(() => {
    if (variants.length === 0) return
    if (!selectedColorKey && !selectedSize) return
    const idx = variants.findIndex(v => {
      const meta = getColorMeta(v.options?.color)
      const size = v.options?.size || ''
      const colorMatch = selectedColorKey ? meta.key === selectedColorKey : true
      const sizeMatch = selectedSize ? size === selectedSize : true
      return colorMatch && sizeMatch
    })
    if (idx >= 0 && idx !== selectedVariantIndex) {
      setSelectedVariantIndex(idx)
      if (variants[idx]?.image?.url) setMainImage(variants[idx].image.url)
    }
  }, [variants, selectedColorKey, selectedSize, selectedVariantIndex])


  /* ================= SAFE EARLY RETURNS ================= */
  if (isLoading) return (
    <div className="p-6 flex flex-col md:flex-row gap-6 animate-pulse max-w-7xl mx-auto">
      <div className="md:w-1/2 space-y-4">
        <div className="w-full h-96 bg-gray-200 rounded"></div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-20 sm:h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
      <div className="md:w-1/2 space-y-4">
        <div className="h-10 bg-gray-200 rounded w-3/4"></div>
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-24 bg-gray-200 rounded w-full mt-4"></div>
        <div className="h-32 bg-gray-100 rounded-md p-4 mt-6 border"></div>
        <div className="flex gap-4 mt-6">
          <div className="h-10 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    </div>
  )
  if (!product) return <p>Product not found</p>

  /* ================= LOGIC ================= */
  // backend returns array of product ids directly, wait for wishlistData to resolve
  const isInWishlist = wishlistItems.some(
    id => id.toString() === product._id.toString() || id?.productId === product._id
  )

  const currentStock = selectedVariant ? selectedVariant.stock : (product.stock ?? 0);
  const currentPrice = selectedVariant ? selectedVariant.price : (product.price ?? 0);
  const currentDiscount = Number(selectedVariant?.discount ?? product.discount ?? 0)
  const discountedCurrentPrice = currentDiscount > 0
    ? Math.round((currentPrice || 0) * (1 - currentDiscount / 100))
    : (currentPrice || 0)

  const handleAddToCart = async () => {
    if (variants.length > 0 && selectedVariantIndex >= 0) {
      if (!selectedColorKey || (availableVariantSizes.length > 0 && !selectedSize)) {
        toast({ title: 'Select color and size before adding', variant: 'destructive' })
        return
      }
    } else if (variants.length > 0 && selectedVariantIndex === -1 && mainSizes.length === 0) {
      toast({ title: 'Select a variant before adding', variant: 'destructive' })
      return
    } else if (mainSizes.length > 0 && !selectedBaseSize) {
      toast({ title: 'Select a size before adding', variant: 'destructive' })
      return
    } else if (baseColorMeta && !selectedBaseColor) {
      toast({ title: 'Select a color before adding', variant: 'destructive' })
      return
    }
    if (!user) {

      const variantPayload = selectedVariant
        ? {
          _id: selectedVariant._id,
          sku: selectedVariant.sku,
          size: selectedVariant.options?.size || selectedSize || undefined,
          color: selectedVariant.options?.color?.name || selectedVariant.options?.color?._id || selectedVariant.options?.color || undefined
        }
        : ((selectedBaseSize || selectedBaseColor) ? { size: selectedBaseSize || undefined, color: selectedBaseColor || undefined } : null)

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
  variantLabel: selectedVariant
    ? `${(selectedVariant.options?.color?.name || selectedVariant.options?.color || '').trim()}${selectedVariant.options?.size ? ` / ${selectedVariant.options?.size}` : ''}`.trim()
    : [
        selectedBaseColor ? `Color: ${selectedBaseColor}` : '',
        selectedBaseSize ? `Size: ${selectedBaseSize}` : ''
      ].filter(Boolean).join(' / '),
  variantStock: selectedVariant?.stock,
  addedAt: new Date().toISOString(),
  key: `${product._id}-${variantPayload?.sku || variantPayload?.size || 'default'}`
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

      /* ---------- FIX #5 (SAFE VARIANT PAYLOAD) ---------- */
      const variantPayload = selectedVariant
        ? {
          _id: selectedVariant._id,
          sku: selectedVariant.sku,
          size: selectedVariant.options?.size || selectedSize || undefined,
          color: selectedVariant.options?.color?.name || selectedVariant.options?.color?._id || selectedVariant.options?.color || undefined
        }
        : ((selectedBaseSize || selectedBaseColor) ? { size: selectedBaseSize || undefined, color: selectedBaseColor || undefined } : null)

      const updatedCart = await cartApi.addToCart(
        product._id,
        quantity,
        variantPayload
      )

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
    ...(product.images?.length ? [product.images[0]] : []), // main image
    ...variants
      .map(v => v.image)
      .filter(img => img && img.url),
    ...(product.images?.slice(1) || []) // remaining product images
  ]

  /* ================= RENDER ================= */
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-14 lg:space-y-12">
      <div className="flex flex-col lg:flex-row gap-12 xl:gap-16">
        {/* IMAGES COLUMN */}
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

            return (
              <div
                key={idx}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${getImageUrl(mainImage) === url ? 'border-black' : 'border-transparent hover:border-gray-200'
                  }`}
                onClick={() => setMainImage(url)}
              >
                <img
                  src={url}
                  className="w-full h-full object-cover"
                />
              </div>
            )
          })}
        </div>
        </div>

        {/* DETAILS COLUMN */}
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

          {(mainSizes.length > 0 || baseColorMeta) && (
            <div className="space-y-3 pt-2">
              <div>
                {baseColorMeta && (
                  <div className="mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Base Color</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedVariantIndex(-1)
                          setSelectedBaseColor(baseColorMeta.name || baseColorMeta.key)
                        }}
                        className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                          selectedBaseColor ? 'border-black' : 'border-gray-200'
                        }`}
                        style={baseColorMeta.hex ? { backgroundColor: baseColorMeta.hex } : undefined}
                        title={baseColorMeta.name}
                      >
                        {!baseColorMeta.hex && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">
                            {baseColorMeta.name?.slice(0, 3) || 'N/A'}
                          </span>
                        )}
                      </button>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {baseColorMeta.name || 'Color'}
                      </span>
                    </div>
                  </div>
                )}

                {mainSizes.length > 0 && (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Main Sizes</p>
                    <div className="flex flex-wrap gap-2">
                      {mainSizes.map(size => {
                        const checked = selectedBaseSize === size
                        return (
                          <button
                            key={`main-${size}`}
                            onClick={() => {
                              setSelectedVariantIndex(-1)
                              setSelectedBaseSize(size)
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
                              checked
                                ? 'border-black bg-black text-white'
                                : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-black'
                            }`}
                          >
                            {size}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        {/* VARIANT SELECTOR */}
          {variants.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <span>Select Option</span>
                <span>{variants.length} Options available</span>
              </div>
              <div className="space-y-3">
                {variantColorOptions.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Color</p>
                    <div className="flex flex-wrap gap-2">
                      {variantColorOptions.map(c => {
                        const isSelected = selectedColorKey === c.key
                        return (
                          <button
                            key={`color-${c.key}`}
                            onClick={() => {
                              setSelectedColorKey(c.key)
                              const sizesForColor = variantSizesByColor.get(c.key)
                              if (sizesForColor && sizesForColor.size > 0) {
                                setSelectedSize(Array.from(sizesForColor)[0])
                              }
                            }}
                            className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                              isSelected ? 'border-black scale-105' : 'border-gray-200 hover:border-gray-400'
                            }`}
                            style={c.hex ? { backgroundColor: c.hex } : undefined}
                            title={c.name}
                          >
                            {!c.hex && (
                              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">
                                {c.name?.slice(0, 3) || 'N/A'}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {availableVariantSizes.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Size</p>
                    <div className="flex flex-wrap gap-2">
                      {availableVariantSizes.map(size => {
                        const checked = selectedSize === size
                        return (
                          <button
                            key={`variant-size-${size}`}
                            onClick={() => setSelectedSize(size)}
                            className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
                              checked
                                ? 'border-black bg-black text-white'
                                : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-black'
                            }`}
                          >
                            {size}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* INVENTORY & INFO */}
          <div className="space-y-4 pt-8 border-t border-gray-100">
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

          {/* PURCHASE ACTIONS */}
          <div className="space-y-4 pt-4">
            <div className="flex gap-4">
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

              <Button
                onClick={handleAddToCart}
                disabled={currentStock < 1 || isAdding}
                className="flex-1 h-12 bg-black hover:bg-slate-800 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
              >
                {isAdding ? 'Adding to cart...' : (currentStock > 0 ? 'Add to Bag' : 'Sold Out')}
              </Button>

              <button
                onClick={handleWishlistToggle}
                className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all ${isInWishlist ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-gray-100 hover:border-gray-900 border-2'
                  }`}
              >
                <Heart size={20} className={isInWishlist ? "fill-current" : ""} />
              </button>
            </div>
          </div>
        </div>
      </div>

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
            <ReviewForm
              productId={product._id}
              onSuccess={refetchReviews}
              user={user}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
