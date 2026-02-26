import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAddReviewMutation } from './productApi'
import { useToast } from '@/hooks/use-toast'

export default function ReviewForm({ productId, onSuccess, user }) {
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [addReview, { isLoading }] = useAddReviewMutation()
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return toast({ title: 'Login to submit review', variant: 'destructive' })
    if (!productId) return toast({ title: 'Product ID missing', variant: 'destructive' })

    try {
      await addReview({ productId, rating, comment }).unwrap()
      toast({ title: 'Review added' })
      setRating(5)
      setHover(0)
      setComment('')
      onSuccess?.()
    } catch (err) {
      toast({ title: err?.data?.message || 'Failed to submit review', variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-6">
      <h3 className="font-semibold">Leave a review</h3>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-2xl cursor-pointer ${hover >= star || rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
          >
            ★
          </span>
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating} / 5</span>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write your review..."
        className="w-full border rounded p-2"
        required
      />

      <Button type="submit" disabled={isLoading || !user}>
        {isLoading ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}
