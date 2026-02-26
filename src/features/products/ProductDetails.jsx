import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
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

/* ================= IMAGE HELPER ================= */
const getImageUrl = (img) => {
  if (!img) return ''
  if (typeof img === 'string') return img
  return img.url || ''
}

export default function ProductDetails() {
  const { id } = useParams()
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

  const variants = product?.variants || []
  const selectedVariant = variants[selectedVariantIndex] || {}

  /* ================= EFFECTS (ALWAYS BEFORE RETURN) ================= */
 useEffect(() => {
  if (product) {
    setMainImage(product.images?.[0]?.url || '')
  }
}, [product])


  /* ================= SAFE EARLY RETURNS ================= */
  if (isLoading) return <p>Loading...</p>
  if (!product) return <p>Product not found</p>

  /* ================= LOGIC ================= */
  const isInWishlist = wishlistItems.some(
    item => item.productId === product._id
  )

  const handleAddToCart = async () => {
    const stock = selectedVariant.stock ?? product.stock
    if (stock < quantity) {
      toast({ title: 'Not enough stock', variant: 'destructive' })
      return
    }

    const updatedCart = await cartApi.addToCart(
      product._id,
      quantity,
      selectedVariant
    )
    dispatch(setCart(updatedCart))
    toast({ title: 'Added to Cart' })
  }

  const handleWishlistToggle = async () => {
    if (!user) {
      toast({ title: 'Login required', variant: 'destructive' })
      return
    }
    await toggleWishlist(product._id)
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

        <p>{product.description}</p>

        <Button onClick={handleAddToCart}>Add to Cart</Button>
        <Button
          variant={isInWishlist ? 'destructive' : 'outline'}
          onClick={handleWishlistToggle}
        >
          Wishlist
        </Button>

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
