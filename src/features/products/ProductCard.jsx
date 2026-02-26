import { Link } from 'react-router-dom'
import { useAppDispatch } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { Heart } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { setCart } from '../cart/cartSlice'
import * as cartApi from '../cart/cartApi'
import {
  useGetWishlistQuery,
  useToggleWishlistMutation,
} from '../wishlist/wishlistApi'
import StarRating from './StarRating'

export default function ProductCard({ product, featured }) {
  const dispatch = useAppDispatch()
  const { toast } = useToast()

  const { data } = useGetWishlistQuery()
  const [toggleWishlist] = useToggleWishlistMutation()
  const wishlist = data?.wishlist || []

  const isWishlisted = wishlist.some((p) => p._id === product._id)

  const handleAddToCart = async () => {
    try {
      const updatedCart = await cartApi.addToCart(product._id, 1)
      dispatch(setCart(updatedCart))
      toast({ title: 'Added to cart', description: product.title })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to add to cart',
        variant: 'destructive',
      })
    }
  }

  const handleWishlist = async () => {
    try {
      await toggleWishlist(product._id).unwrap()
      toast({
        title: isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️',
      })
    } catch {
      toast({
        title: 'Login required',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className={`relative ${featured ? 'border-yellow-500' : ''}`}>
      <Heart
        onClick={handleWishlist}
        size={20}
        className={`absolute top-1 right-3 cursor-pointer ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400'
          }`}
      />

      {/* 🔗 LINK IMAGE + TITLE */}
      <Link to={`/products/${product._id}`}>
        <CardHeader>
          <img
  src={product.images?.[0]?.url}
  alt={product.title}
  className="w-full h-72 object-contain rounded"
  onError={(e) => {
    e.currentTarget.src = '/placeholder.png'
  }}
/>

        </CardHeader>
      </Link>

      <CardContent className="space-y-1">
        <Link to={`/products/${product._id}`}>
          <h3 className="font-semibold line-clamp-1 hover:underline">
            {product.title}
          </h3>
        </Link>
        <p className="font-medium">₦{product.price}</p>
      <StarRating rating={product.avgRating} />
  <span className="ml-2 text-gray-600 text-sm">
    {product.avgRating.toFixed(1)} 
  </span>

      </CardContent>

      <CardFooter>
        <Button onClick={handleAddToCart} size="sm" className="w-full me-2">
          Add to Cart
        </Button>
        <Link to={`/products/${product._id}`} className="w-full">
          <Button variant="outline" size="sm" className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
