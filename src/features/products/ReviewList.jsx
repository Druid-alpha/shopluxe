import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Pencil, Trash2, Star } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { useUpdateReviewMutation, useDeleteReviewMutation } from './productApi'

export default function ReviewList({ reviews = [], productId, onRefetch }) {
  const user = useAppSelector(state => state.auth.user)
  const { toast } = useToast()
  const [editingId, setEditingId] = useState(null)
  const [editComment, setEditComment] = useState('')
  const [editRating, setEditRating] = useState(5)

  const [updateReview] = useUpdateReviewMutation()
  const [deleteReview] = useDeleteReviewMutation()

  const handleEdit = (r) => {
    setEditingId(r._id)
    setEditComment(r.body || '')
    setEditRating(r.rating)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditComment('')
    setEditRating(5)
  }

  const handleUpdate = async (r) => {
    try {
      await updateReview({ reviewId: r._id, rating: editRating, comment: editComment }).unwrap()
      toast({ title: 'Review updated' })
      setEditingId(null)
      onRefetch?.()
    } catch {
      toast({ title: 'Failed to update review', variant: 'destructive' })
    }
  }

  const handleDelete = async (r) => {
    if (!window.confirm('Are you sure?')) return
    try {
      await deleteReview(r._id).unwrap()
      toast({ title: 'Review deleted' })
      onRefetch?.()
    } catch {
      toast({ title: 'Failed to delete review', variant: 'destructive' })
    }
  }

  if (!reviews.length) return <p>No reviews yet.</p>

  return (
    <div className="space-y-4 mt-4">
      {reviews.map((r) => {
        const isOwner = user && (r.user?._id || r.user) === user.id
        return (
          <div key={r._id} className="border p-3 rounded">
            <div className="flex justify-between items-start mb-1">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <span className="font-bold mr-2">{r.user?.name || 'User'}</span>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={14}
                      className={s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                {r.createdAt && (
                  <span className="text-xs text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </div>

              {isOwner && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(r)} className="flex items-center gap-1">
                    <Pencil size={14} /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(r)} className="flex items-center gap-1">
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              )}
            </div>

            {editingId === r._id ? (
              <div className="space-y-2 mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={24}
                      className={`cursor-pointer ${editRating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      onClick={() => setEditRating(s)}
                    />
                  ))}
                </div>
                <textarea className="w-full border rounded p-2" value={editComment} onChange={e => setEditComment(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdate(r)}>Save</Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="mt-2">{r.body}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
