import React, { useState, useRef, useCallback } from 'react'
import {
    useGetAdminReviewsQuery,
    useDeleteReviewAdminMutation,
    useToggleFeaturedReviewMutation
} from '@/features/products/productApi'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/AlertDialog'
import { useToast } from '@/hooks/use-toast'
import { Trash2, Star, User, Package, MessageSquare, Home } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminReviews() {
    const { toast } = useToast()
    const [page, setPage] = useState(1)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [reviewToDelete, setReviewToDelete] = useState(null)
    const [filters, setFilters] = useState({
        search: '',
        rating: '',
        verified: '',
        featured: ''
    })
    const [appliedFilters, setAppliedFilters] = useState({
        search: '',
        rating: '',
        verified: '',
        featured: ''
    })
    const { data, isLoading, refetch } = useGetAdminReviewsQuery({ page, ...appliedFilters })
    const [deleteReview] = useDeleteReviewAdminMutation()
    const [toggleFeatured] = useToggleFeaturedReviewMutation()
    const listTopRef = useRef(null)
    const scrollToListTop = useCallback(() => {
        if (listTopRef.current) {
            listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
            return
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    const handleToggleFeature = async (id) => {
        try {
            await toggleFeatured(id).unwrap()
            toast({ title: 'Featured status updated' })
            refetch()
        } catch (err) {
            toast({ title: 'Failed to update status', variant: 'destructive' })
        }
    }

    const handleDelete = async () => {
        if (!reviewToDelete) return
        try {
            await deleteReview(reviewToDelete).unwrap()
            setReviewToDelete(null)
            toast({ title: 'Review permanently deleted' })
            refetch()
        } catch (err) {
            setReviewToDelete(null)
            toast({
                title: 'Error',
                description: err?.data?.message || 'Delete failed',
                variant: 'destructive'
            })
        }
    }

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
    )

    const hasActiveFilters = Object.values(appliedFilters).some(Boolean)
    const totalPages = data?.pages || 1
    const filteredReviews = (data?.reviews || []).filter((review) => {
        if (!review) return false
        const search = appliedFilters.search?.trim().toLowerCase()
        const matchesSearch = !search || [
            review.user?.name,
            review.user?.email,
            review.title,
            review.body,
            review.comment,
            review.product?.title
        ].some((val) => String(val || '').toLowerCase().includes(search))

        const rating = appliedFilters.rating ? Number(appliedFilters.rating) : null
        const matchesRating = rating ? Number(review.rating) === rating : true

        const matchesVerified =
            appliedFilters.verified === 'verified'
                ? review.isVerified === true
                : appliedFilters.verified === 'guest'
                    ? review.isVerified !== true
                    : true

        const matchesFeatured =
            appliedFilters.featured === 'featured'
                ? review.isFeatured === true
                : appliedFilters.featured === 'not_featured'
                    ? review.isFeatured !== true
                    : true

        return matchesSearch && matchesRating && matchesVerified && matchesFeatured
    })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase">Product Reviews</h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Manage customer feedback and ratings</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((prev) => !prev)}
                        className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black border border-gray-200 rounded-full px-3 py-2"
                    >
                        {filtersOpen ? 'Hide Filters' : 'Show Filters'}
                    </button>
                    <div className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {hasActiveFilters ? `${filteredReviews.length} Filtered` : `${data?.total || 0} Total Reviews`}
                    </div>
                </div>
            </div>

            {filtersOpen && (
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                            type="text"
                            placeholder="Search by user or title"
                            className="h-10 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            value={filters.search}
                            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                        />
                        <select
                            className="h-10 rounded-xl border border-gray-200 px-3 text-sm bg-white"
                            value={filters.rating}
                            onChange={(e) => setFilters((prev) => ({ ...prev, rating: e.target.value }))}
                        >
                            <option value="">Rating (All)</option>
                            <option value="5">5 stars</option>
                            <option value="4">4 stars</option>
                            <option value="3">3 stars</option>
                            <option value="2">2 stars</option>
                            <option value="1">1 star</option>
                        </select>
                        <select
                            className="h-10 rounded-xl border border-gray-200 px-3 text-sm bg-white"
                            value={filters.verified}
                            onChange={(e) => setFilters((prev) => ({ ...prev, verified: e.target.value }))}
                        >
                            <option value="">Verified (All)</option>
                            <option value="verified">Verified</option>
                            <option value="guest">Guest</option>
                        </select>
                        <select
                            className="h-10 rounded-xl border border-gray-200 px-3 text-sm bg-white"
                            value={filters.featured}
                            onChange={(e) => setFilters((prev) => ({ ...prev, featured: e.target.value }))}
                        >
                            <option value="">Featured (All)</option>
                            <option value="featured">Featured</option>
                            <option value="not_featured">Not Featured</option>
                        </select>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => {
                                setAppliedFilters({
                                    search: filters.search.trim(),
                                    rating: filters.rating,
                                    verified: filters.verified,
                                    featured: filters.featured
                                })
                                setPage(1)
                            }}
                        >
                            Apply Filters
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => {
                                const cleared = { search: '', rating: '', verified: '', featured: '' }
                                setFilters(cleared)
                                setAppliedFilters(cleared)
                                setPage(1)
                            }}
                        >
                            Reset
                        </Button>
                    </div>
                </div>
            )}

            <div ref={listTopRef} />
            <div className="grid gap-5">
                <AnimatePresence mode="popLayout">
                    {filteredReviews?.length > 0 ? (
                        filteredReviews.map((review, idx) => (
                            <motion.div
                                key={review._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group hover:-translate-y-0.5"
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* User & Rating */}
                                    <div className="md:w-48 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden uppercase font-black text-xs text-gray-400">
                                                {review.user?.avatar ? <img src={review.user.avatar} className="w-full h-full object-cover" /> : <User size={16} />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-tight text-gray-900 truncate max-w-[120px]">{review.user?.name || 'Anonymous'}</p>
                                                <p className="text-[10px] text-gray-400 font-bold lowercase tracking-tighter">{review.user?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={12}
                                                    className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                                                />
                                            ))}
                                            <span className="text-[10px] font-black text-amber-600 ml-1">{review.rating}.0</span>
                                        </div>
                                        <div className="pt-2">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded ${review.isVerified ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                                                {review.isVerified ? 'Verified Purchase' : 'Guest Review'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">{review.title || 'No Title'}</h4>
                                                <p className="text-xs text-gray-500 leading-relaxed italic">"{review.body || 'No comment provided.'}"</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleToggleFeature(review._id)}
                                                    title={review.isFeatured ? "Remove from Home" : "Show on Home"}
                                                    className={`p-3 rounded-xl transition-all transform group-hover:scale-110 ${review.isFeatured ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 hover:text-black'}`}
                                                >
                                                    <Home size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setReviewToDelete(review._id)}
                                                    className="p-3 rounded-xl bg-red-50 text-red-400 hover:bg-red-600 hover:text-white transition-all transform group-hover:scale-110"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <Package size={14} className="text-gray-300" />
                                                <div>
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Product</span>
                                                    <span className="text-[10px] font-bold text-gray-700">{review.product?.title || 'Unknown Product'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MessageSquare size={14} className="text-gray-300" />
                                                <div>
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Helpful Votes</span>
                                                    <span className="text-[10px] font-bold text-gray-700">{review.helpful || 0} People found this helpful</span>
                                                </div>
                                            </div>
                                            <div className="ml-auto">
                                                <span className="text-[10px] font-bold text-gray-300 tracking-tighter">
                                                    {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl">
                            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
                                {hasActiveFilters ? 'No reviews match these filters.' : 'No reviews found in the system.'}
                            </p>
                            <div className="mt-5 flex items-center justify-center gap-3">
                                <Button variant="outline" className="rounded-xl" onClick={() => refetch()}>
                                    Refresh
                                </Button>
                                {hasActiveFilters && (
                                    <Button
                                        variant="outline"
                                        className="rounded-xl"
                                        onClick={() => {
                                            const cleared = { search: '', rating: '', verified: '', featured: '' }
                                            setFilters(cleared)
                                            setAppliedFilters(cleared)
                                            setPage(1)
                                        }}
                                    >
                                        Reset Filters
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-10">
                    <Button
                        disabled={page <= 1}
                        onClick={() => {
                            setPage(p => p - 1)
                            scrollToListTop()
                        }}
                        variant="outline"
                        className="rounded-xl"
                    >
                        Prev
                    </Button>
                    <span className="text-xs font-black uppercase tracking-widest">Page {page} of {totalPages}</span>
                    <Button
                        disabled={page >= totalPages}
                        onClick={() => {
                            setPage(p => p + 1)
                            scrollToListTop()
                        }}
                        variant="outline"
                        className="rounded-xl"
                    >
                        Next
                    </Button>
                </div>
            )}

            <AlertDialog open={!!reviewToDelete} onOpenChange={(open) => !open && setReviewToDelete(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this review?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The review will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-red-600 hover:bg-red-700 text-white">
                            Delete Review
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
