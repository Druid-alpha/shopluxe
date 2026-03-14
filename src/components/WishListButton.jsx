


import { useAppDispatch, useAppSelector } from '@/app/hooks'
import * as React from 'react'

export default function WishListButton({ product }) {
  const dispatch = useAppDispatch()
  const wishList = useAppSelector((state) => state.wishList.items)
  const isWishListed = wishList.some((item) => item.productId === product._id)
  return (
    <div>
      <span className={`cursor-pointer text-2xl ${isWishListed ? 'text-red-500' : 'text-gray-300'}`}
        onClick={() => dispatch(toggleWishlist({ productId: product._id, title: product.title }))}
      >
        Love
      </span>
    </div>
  )
}

