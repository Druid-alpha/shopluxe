import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetProductQuery, useGetReviewsQuery } from './productApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { addGuestCart, setCart } from '../cart/cartSlice'
import { toggleGuestWishlist } from '../wishlist/wishlistSlice'
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

  const { data, isLoading, refetch } = useGetProductQuery(id)
  const product = data?.product

  const { data: reviewsData, refetch: refetchReviews } =
    useGetReviewsQuery(id)

  const reviews = reviewsData?.reviews || []

  const { data: wishlistData } = useGetWishlistQuery()
  const wishlistItems = wishlistData?.wishlist || []
  const [toggleWishlist] = useToggleWishlistMutation()

  /* ================= STATE ================= */
  const [mainImage, setMainImage] = React.useState(null)
  const [selectedVariantIndex, setSelectedVariantIndex] = React.useState(0)
  const [quantity, setQuantity] = React.useState(1)
  const [isAdding, setIsAdding] = React.useState(false)

  const variants = product?.variants || []
  const selectedVariant =
    variants.length > 0 ? variants[selectedVariantIndex] : null

  /* ================= SET DEFAULT MAIN IMAGE ================= */
  React.useEffect(() => {
    if (product?.images?.length) {
      setMainImage(product.images[0])
    }
  }, [product])

  /* ================= AUTO SWITCH IMAGE + RESET QTY ================= */
  React.useEffect(() => {
    if (selectedVariant?.image) {
      setMainImage(selectedVariant.image)
    } else if (product?.images?.length) {
      setMainImage(product.images[0])
    }
    setQuantity(1)
  }, [selectedVariantIndex])

  /* ================= SAFE RETURNS ================= */
  if (isLoading) return <p className="p-6">Loading...</p>
  if (!product) return <p className="p-6">Product not found</p>

  /* ================= LOGIC ================= */
  const isInWishlist = wishlistItems.some(
    id =>
      id.toString() === product._id.toString() ||
      id?.productId === product._id
  )

  const currentStock =
    selectedVariant?.stock ?? product.stock ?? 0

  const currentPrice =
    selectedVariant?.price ?? product.price ?? 0

  const handleAddToCart = async () => {
    if (currentStock < quantity) {
      toast({ title: 'Not enough stock', variant: 'destructive' })
      return
    }

    if (!user) {
      dispatch(
        addGuestCart({
          product: product._id,
          qty: quantity,
          variant: selectedVariant
            ? {
                _id: selectedVariant._id,
                sku: selectedVariant.sku
              }
            : null
        })
      )

      toast({ title: 'Added to cart (Guest)' })
      return
    }

    setIsAdding(true)

    try {
      const updatedCart = await cartApi.addToCart(
        product._id,
        quantity,
        selectedVariant
          ? {
              _id: selectedVariant._id,
              sku: selectedVariant.sku
            }
          : null
      )

      dispatch(setCart(updatedCart))
      toast({ title: 'Added to Cart' })
      navigate('/cart')
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err.response?.data?.message ||
          'Failed to add to cart',
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

  /* ================= MERGED IMAGE LIST ================= */
  const imageList = [
    ...(product.images || []),
    ...variants
      .map(v => v.image)
      .filter(img => img && img.url)
  ]

  /* ================= RENDER ================= */
  return (
    <div className="p-6 flex flex-col md:flex-row gap-8">

      {/* IMAGES */}
      <div className="md:w-1/2 space-y-4">
        <img
          src={getImageUrl(mainImage)}
          alt={product.title}
          className="w-full h-96 object-contain rounded"
        />

        <div className="flex gap-2 flex-wrap">
          {imageList.map((img, idx) => (
            <img
              key={idx}
              src={getImageUrl(img)}
              onClick={() => setMainImage(img)}
              className={`w-20 h-20 object-cover rounded cursor-pointer border ${
                mainImage?.url === img?.url
                  ? 'border-black'
                  : 'border-gray-200'
              }`}
            />
          ))}
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

        <p className="text-gray-700">
          {product.description}
        </p>

        <div className="text-3xl font-bold">
          ₦{currentPrice.toLocaleString()}
        </div>

        {/* VARIANTS */}
        {variants.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase text-gray-500">
              Select Variant
            </h3>
            <div className="flex flex-wrap gap-3">
              {variants.map((v, idx) => (
                <button
                  key={idx}
                  disabled={v.stock === 0}
                  onClick={() =>
                    setSelectedVariantIndex(idx)
                  }
                  className={`px-4 py-2 border rounded-md text-sm ${
                    selectedVariantIndex === idx
                      ? 'bg-black text-white'
                      : 'bg-white'
                  } ${
                    v.stock === 0
                      ? 'opacity-40 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {v.color && (
                    <span className="mr-1 capitalize">
                      {v.color}
                    </span>
                  )}
                  {v.size && (
                    <span className="uppercase">
                      {v.size}
                    </span>
                  )}
                  {!v.color &&
                    !v.size &&
                    (v.sku || `Variant ${idx + 1}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* INVENTORY */}
        <div className="pt-4 border-t">
          {currentStock > 0 ? (
            <span className="text-green-600 font-bold">
              {currentStock} Units Available
            </span>
          ) : (
            <span className="text-red-500 font-bold">
              Out of Stock
            </span>
          )}
        </div>

        {/* QUANTITY + ACTIONS */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center border rounded">
            <button
              onClick={() =>
                setQuantity(Math.max(1, quantity - 1))
              }
              className="px-3"
            >
              -
            </button>
            <span className="px-4">{quantity}</span>
            <button
              onClick={() =>
                setQuantity(
                  Math.min(currentStock, quantity + 1)
                )
              }
              className="px-3"
            >
              +
            </button>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={currentStock < 1 || isAdding}
          >
            {isAdding
              ? 'Adding...'
              : currentStock > 0
              ? 'Add to Cart'
              : 'Out of Stock'}
          </Button>

          <Button
            variant={
              isInWishlist ? 'destructive' : 'outline'
            }
            onClick={handleWishlistToggle}
          >
            <Heart
              size={18}
              className={
                isInWishlist ? 'fill-current' : ''
              }
            />
          </Button>
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