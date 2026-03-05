import React from 'react'
import { Star } from 'lucide-react'

export default function ReviewSummary({ reviews = [], avgRating = 0, reviewsCount = 0 }) {
    const distribution = [5, 4, 3, 2, 1].map(star => {
        const count = reviews.filter(r => r.rating === star).length
        const percentage = reviewsCount > 0 ? (count / reviewsCount) * 100 : 0
        return { star, count, percentage }
    })

    return (
        <div className="grid md:grid-cols-2 gap-12 py-10 border-y border-gray-100">
            {/* AVG RATING */}
            <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="text-6xl font-black tracking-tighter text-slate-900">
                    {avgRating.toFixed(1)}
                </div>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                        <Star
                            key={s}
                            size={20}
                            className={s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
                        />
                    ))}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    Based on {reviewsCount} reviews
                </p>
            </div>

            {/* DISTRIBUTION BARS */}
            <div className="space-y-3">
                {distribution.map(d => (
                    <div key={d.star} className="flex items-center gap-4 group">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 w-12 shrink-0">
                            {d.star} Stars
                        </span>
                        <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-slate-900 transition-all duration-500 ease-out group-hover:bg-yellow-400"
                                style={{ width: `${d.percentage}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 w-8 shrink-0 text-right">
                            {Math.round(d.percentage)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
