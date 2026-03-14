import React from 'react'
import { useGetFeaturedReviewsQuery } from '@/features/products/productApi'
import { Star, Quote } from 'lucide-react'

export default function FeaturedReviews() {
    const { data, isLoading } = useGetFeaturedReviewsQuery(undefined, {
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
        refetchOnReconnect: true,
    })
    const featuredReviews = (data?.reviews || []).filter(
        (review) => review?.isFeatured === true
    )

    if (isLoading || !featuredReviews.length) return null

    const loopReviews = [...featuredReviews, ...featuredReviews]

    return (
        <section className="py-20 bg-gray-50/50 relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-12">
                    <span className="text-[10px] font-black uppercase tracking-[.4em] text-gray-400 mb-4 block">
                        Testimonials
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-6">
                        Community <span className="text-gray-400">Voice</span>
                    </h2>
                    <div className="h-1.5 w-16 bg-black mx-auto rounded-full" />
                </div>
            </div>

            <div className="relative w-full overflow-hidden">
                <div className="review-marquee">
                    <div className="review-track">
                        {loopReviews.map((review, idx) => (
                            <div key={`${review._id}-${idx}`} className="review-card">
                                <div className="review-inner">
                                    <div className="flex gap-1 mb-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={12}
                                                className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-100'}
                                            />
                                        ))}
                                    </div>
                                    {review.title && (
                                        <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 mb-3">
                                            {review.title}
                                        </h3>
                                    )}
                                    <div className="relative">
                                        <Quote className="absolute -top-3 -left-3 text-gray-100 h-8 w-8 -z-10" />
                                        <p className="text-gray-600 text-sm leading-relaxed italic font-medium line-clamp-4">
                                            "{review.body || review.comment || ''}"
                                        </p>
                                    </div>
                                    <div className="mt-5 pt-4 border-t border-gray-100">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">
                                            {review.user?.name || 'Customer'}
                                        </p>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                            {review.product?.title || 'Purchase'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx="true">{`
                .review-marquee {
                    width: 100%;
                    overflow: hidden;
                }
                .review-track {
                    display: flex;
                    gap: 16px;
                    width: max-content;
                    animation: scrollReviews 40s linear infinite;
                    padding: 0 16px;
                }
                .review-card {
                    width: 280px;
                    flex: 0 0 auto;
                }
                .review-inner {
                    background: white;
                    border: 1px solid #f3f4f6;
                    border-radius: 24px;
                    padding: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.04);
                    height: 100%;
                }
                @media (max-width: 768px) {
                    .review-card {
                        width: 240px;
                    }
                    .review-track {
                        animation-duration: 28s;
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .review-track {
                        animation: none;
                    }
                }
                @keyframes scrollReviews {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </section>
    )
}
