import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAddReviewMutation } from './productApi'
import { useToast } from '@/hooks/use-toast'

const ratingLabels = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
}

export default function ReviewForm({ productId, onSuccess, user }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [addReview, { isLoading }] = useAddReviewMutation()
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return toast({ title: 'Login to submit review', variant: 'destructive' })
    if (!productId) return toast({ title: 'Product ID missing', variant: 'destructive' })
    if (!rating) return toast({ title: 'Please select a rating', variant: 'destructive' })

    try {
      await addReview({ productId, rating, title, comment }).unwrap()
      toast({ title: 'Review added' })
      setRating(0)
      setHover(0)
      setTitle('')
      setComment('')
      onSuccess?.()
    } catch (err) {
      toast({ title: err?.data?.message || 'Failed to submit review', variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-6">
      <h3 className="font-semibold">Leave a review</h3>
      <p className="text-xs text-gray-500">Rating and review text are required.</p>
      <p className="text-[11px] text-gray-500">
        Share fit, quality, delivery speed, and whether you would buy again.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              className={`w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-2xl transition-all border ${hover >= star || rating >= star ? 'text-yellow-400 border-yellow-200 bg-yellow-50/60' : 'text-gray-300 border-gray-200 bg-white'}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
            >
              ★
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-600 font-medium">
          {rating ? `${ratingLabels[rating]} (${rating} / 5)` : 'Tap to rate'}
        </span>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Review Title (e.g. Amazing product!)"
        className="w-full border rounded-xl p-3 text-xs font-black uppercase tracking-widest placeholder:text-gray-300 focus:outline-none focus:border-black transition-all"
      />

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write your review (at least 10 characters)..."
        className="w-full border rounded-xl p-4 text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:border-black transition-all min-h-[120px]"
        required
        minLength={10}
      />

      <Button type="submit" disabled={isLoading || !user || !rating || !comment.trim() || comment.trim().length < 10}>
        {isLoading ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}

