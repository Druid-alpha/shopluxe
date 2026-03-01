import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetProductQuery, useGetReviewsQuery } from './productApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
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

/* ================= IMAGE HELPER ================= */
const getImageUrl = (img) => {
  if (!img) return ''
  if (typeof img === 'string') return img
  return img.url || ''
}

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const user = useAppSelector(state => state.auth.user)

  /* ================= QUERIES ================= */
  const { data, isLoading } = useGetProductQuery(id)
  const product = data?.product

  const { data: reviewsData, refetch: refetchReviews } =
    useGetReviewsQuery(id)
  const reviews = reviewsData?.reviews || []

  const { data: wishlistData } = useGetWishlistQuery()
  const wishlistItems = wishlistData?.wishlist || []
  const [toggleWishlist] = useToggleWishlistMutation()

  /* ================= STATE ================= */
  const [mainImage, setMainImage] = useState('')
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const variants = product?.variants || []
  const selectedVariant = variants.length > 0 ? variants[selectedVariantIndex] : null

  /* ================= EFFECTS (ALWAYS BEFORE RETURN) ================= */
  useEffect(() => {
    if (product) {
      setMainImage(product.images?.[0]?.url || '')
    }
  }, [product])


  /* ================= SAFE EARLY RETURNS ================= */
  if (isLoading) return (
    <div className="p-6 flex flex-col md:flex-row gap-6 animate-pulse max-w-7xl mx-auto">
      <div className="md:w-1/2 space-y-4">
        <div className="w-full h-96 bg-gray-200 rounded"></div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-20 h-20 bg-gray-200 rounded"></div>
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

  const currentStock = selectedVariant?.stock ?? product.stock ?? 0;

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to add items to your cart',
        variant: 'destructive'
      })
      navigate('/login')
      return
    }

    if (currentStock < quantity) {
      toast({ title: 'Not enough stock', variant: 'destructive' })
      return
    }

    setIsAdding(true)
    try {
      const updatedCart = await cartApi.addToCart(
        product._id,
        quantity,
        selectedVariant
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
      toast({ title: 'Login required', variant: 'destructive' })
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
    <div className="p-6 flex flex-col md:flex-row gap-6">
      {/* IMAGES */}
      <div className="md:w-1/2 space-y-4">
        <img
          src={getImageUrl(mainImage)}
          alt={product.title}
          className="w-full h-96 object-contain  rounded"
        />

        <div className="flex gap-2 flex-wrap">
          {imageList.map((img, idx) => {
            const url = getImageUrl(img)
            if (!url) return null

            return (
              <img
                key={idx}
                src={url}
                className="w-20 h-20 object-cover rounded cursor-pointer border"
                onClick={() => setMainImage(url)}
              />
            )
          })}
        </div>
      </div>

      {/* DETAILS */}
      <div className="md:w-1/2 space-y-4">
        <h1 className="text-2xl font-bold">{product.title}</h1>

        <div className="flex items-center gap-2">
          <StarRating rating={product.avgRating} size={24} />
          <span className="text-sm text-gray-600">
            {product.avgRating?.toFixed(1) ?? '0.0'}
          </span>
        </div>

        <p className="text-gray-700 leading-relaxed text-sm md:text-base">{product.description}</p>

        {/* PRICE DISPLAY */}
        <div className="text-3xl font-bold my-4">
          ₦{(selectedVariant?.price ?? product?.price ?? 0).toLocaleString()}
        </div>

        {/* VARIANT SELECTOR */}
        {variants.length > 0 && (
          <div className="space-y-3 mt-6">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500 mb-2">Select Variant</h3>
            <div className="flex flex-wrap gap-3">
              {variants.map((v, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedVariantIndex(idx);
                    if (v.image?.url) setMainImage(v.image.url);
                  }}
                  className={`px-4 py-2 border rounded-md text-sm font-medium transition-all ${selectedVariantIndex === idx
                    ? 'border-black bg-black text-white shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                >
                  {v.color && <span className="mr-2 capitalize">{v.color}</span>}
                  {v.size && <span className="uppercase">{v.size}</span>}
                  {(!v.color && !v.size) && (v.sku || `Variant ${idx + 1}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Missing Product Details from ProductForm */}
        <div className="space-y-2 text-sm bg-gray-50 p-5 rounded-lg border mt-6">
          <div className="grid grid-cols-2 gap-4">
            {product.category?.name && <div><span className="text-gray-500">Category:</span> <span className="font-medium">{product.category.name}</span></div>}
            {product.brand?.name && <div><span className="text-gray-500">Brand:</span> <span className="font-medium">{product.brand.name}</span></div>}
            {product.clothingType && <div><span className="text-gray-500">Type:</span> <span className="font-medium">{product.clothingType}</span></div>}
            {product.color?.name && <div><span className="text-gray-500">Color:</span> <span className="font-medium">{product.color.name}</span></div>}
          </div>
          {product.tags?.length > 0 && <div className="mt-2 text-gray-500">Tags: <span className="text-gray-800">{product.tags.join(', ')}</span></div>}

          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <span className="font-semibold text-lg">Inventory Status:</span>
            {currentStock > 0 ? (
              <span className="text-green-600 font-bold bg-green-50 px-4 py-1.5 rounded-full border border-green-100 shadow-sm animate-in fade-in zoom-in duration-300">
                {currentStock} UNITS AVAILABLE
              </span>
            ) : (
              <span className="text-red-500 font-bold bg-red-50 px-4 py-1.5 rounded-full border border-red-100 shadow-sm">
                OUT OF STOCK
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-8">
          <div className="flex items-center border border-gray-200 rounded-lg bg-white h-12">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 h-full text-gray-500 hover:text-black transition-colors border-r disabled:opacity-30"
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="px-6 font-semibold min-w-[3rem] text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
              className="px-4 h-full text-gray-500 hover:text-black transition-colors border-l disabled:opacity-30"
              disabled={quantity >= currentStock}
            >
              +
            </button>
          </div>

          <div className="flex-1 flex gap-3 min-w-[200px]">
            <Button
              onClick={handleAddToCart}
              disabled={currentStock < 1 || isAdding}
              size="lg"
              className={`flex-1 text-lg h-12 shadow-sm transition-all ${currentStock < 1 || isAdding ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-black hover:bg-gray-800 text-white'}`}
            >
              {isAdding ? 'Adding...' : (currentStock > 0 ? 'Add to Cart' : 'Out of Stock')}
            </Button>
            <Button
              variant={isInWishlist ? 'destructive' : 'outline'}
              onClick={handleWishlistToggle}
              size="lg"
              className="h-12 w-12 p-0 flex-shrink-0 rounded-xl"
            >
              <Heart size={20} className={isInWishlist ? "fill-current" : ""} />
            </Button>
          </div>
        </div>
        <ReviewForm
          productId={product._id}
          onSuccess={refetchReviews}
          user={user}
        />
        <ReviewList reviews={reviews} />
      </div>
    </div>
  )
}
