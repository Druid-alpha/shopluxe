import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'
import { useGetWishlistQuery, useToggleWishlistMutation } from './wishlistApi'
import { useAppDispatch } from '@/app/hooks'
import { useToast } from '@/hooks/use-toast'
import { setCart } from '../cart/cartSlice'
import * as cartApi from '../cart/cartApi'

export default function Wishlist() {
  const dispatch = useAppDispatch()
  const { toast } = useToast()

  // Fetch wishlist from backend
  const { data, isLoading, isError } = useGetWishlistQuery()
  const [toggleWishlist] = useToggleWishlistMutation()

  if (isLoading) return <p className="text-center p-10">Loading...</p>
  if (isError) return <p className="text-center p-10">Error fetching wishlist</p>

  const wishlist = data?.wishlist || []

  if (!wishlist.length) {
    return (
      <div className="p-10 text-center">
        <Heart className="mx-auto mb-4 text-red-500" size={40} />
        <p>Your wishlist is empty</p>
        <Link to="/products" className="text-primary underline">
          Browse products
        </Link>
      </div>
    )
  }

  // Add product to backend cart and sync Redux
  const handleAddToCart = async (product) => {
    try {
      const updatedCart = await cartApi.addToCart(product._id, 1)
      dispatch(setCart(updatedCart))
      toast({
        title: 'Added to cart',
        description: product.title,
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to add to cart. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Remove product from wishlist
  const handleRemoveWishlist = async (product) => {
    try {
      await toggleWishlist(product._id).unwrap()
      toast({
        title: 'Removed from wishlist',
        description: product.title,
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Could not remove from wishlist',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">❤️ My Wishlist</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {wishlist.map((product) => (
          <div key={product._id} className="border rounded-lg p-4 space-y-3">
           <img
  src={product.images?.[0]?.url || '/placeholder.png'}
  alt={product.title}
  className="h-40 w-full object-cover rounded"
/>

            <h3 className="font-semibold">{product.title}</h3>
            <p className="font-bold">₦{product.price}</p>

            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleAddToCart(product)}>
                Add to Cart
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleRemoveWishlist(product)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
