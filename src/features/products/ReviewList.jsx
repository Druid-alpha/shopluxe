import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Pencil, Trash2, Star } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { useUpdateReviewMutation, useDeleteReviewMutation, useToggleHelpfulMutation } from './productApi'
import { CheckCircle2, ThumbsUp, ChevronDown } from 'lucide-react'

export default function ReviewList({ reviews = [], productId, onRefetch }) {
  const user = useAppSelector(state => state.auth.user)
  const { toast } = useToast()
  const [editingId, setEditingId] = useState(null)
  const [editComment, setEditComment] = useState('')
  const [editRating, setEditRating] = useState(5)

  const [updateReview] = useUpdateReviewMutation()
  const [deleteReview] = useDeleteReviewMutation()
  const [toggleHelpful] = useToggleHelpfulMutation()
  const [sort, setSort] = useState('newest')

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

  const handleToggleHelpful = async (reviewId) => {
    if (!user) return toast({ title: 'Login to vote', variant: 'destructive' })
    try {
      await toggleHelpful(reviewId).unwrap()
    } catch {
      toast({ title: 'Failed to vote', variant: 'destructive' })
    }
  }

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sort === 'highest') return b.rating - a.rating
    if (sort === 'lowest') return a.rating - b.rating
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  if (!reviews.length) return <p>No reviews yet.</p>

  return (
    <div className="space-y-12">
      {/* SORTING */}
      <div className="flex justify-end">
        <div className="relative group">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none bg-white border border-gray-100 rounded-xl px-6 py-3 pr-12 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-black transition-all cursor-pointer shadow-sm"
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
      </div>

      <div className="space-y-10">
        {sortedReviews.map((r) => {
          const isOwner = user && (r.user?._id || r.user) === user.id
          const hasVoted = user && r.helpfulUsers?.includes(user.id)

          return (
            <div key={r._id} className="group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center font-black text-slate-300 text-sm border border-gray-100">
                    {r.user?.name?.[0] || 'U'}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-900 text-sm uppercase tracking-tight">{r.user?.name || 'User'}</span>
                      {r.isVerified && (
                        <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <CheckCircle2 size={10} /> Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star
                            key={s}
                            size={12}
                            className={s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-100'}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {isOwner && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(r)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-slate-900">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(r)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="pl-16 space-y-3">
                <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">{r.title || 'Review'}</h4>

                {editingId === r._id ? (
                  <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          size={20}
                          className={`cursor-pointer ${editRating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                          onClick={() => setEditRating(s)}
                        />
                      ))}
                    </div>
                    <textarea
                      className="w-full border-2 border-white bg-white rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-black transition-all min-h-[100px]"
                      value={editComment}
                      onChange={e => setEditComment(e.target.value)}
                    />
                    <div className="flex gap-3">
                      <Button size="sm" onClick={() => handleUpdate(r)} className="bg-black rounded-none uppercase text-[10px] font-black tracking-widest px-6">Save Changes</Button>
                      <Button size="sm" variant="ghost" onClick={handleCancel} className="uppercase text-[10px] font-black tracking-widest px-6">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">{r.body}</p>
                )}

                <div className="pt-4">
                  <button
                    onClick={() => handleToggleHelpful(r._id)}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border transition-all active:scale-95 ${hasVoted
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-900 hover:text-slate-900'
                      }`}
                  >
                    <ThumbsUp size={12} />
                    Helpful ({r.helpful || 0})
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
