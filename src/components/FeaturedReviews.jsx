import React from 'react'
import { useGetFeaturedReviewsQuery } from '@/features/products/productApi'
import { Star, Quote, User } from 'lucide-react'
import { motion } from 'framer-motion'
import Slider from 'react-slick'

export default function FeaturedReviews() {
    const { data, isLoading } = useGetFeaturedReviewsQuery(undefined, {
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
        refetchOnReconnect: true,
    })
    const featuredReviews = (data?.reviews || []).filter(
        (review) => review?.isFeatured === true
    )

    const settings = {
        dots: true,
        infinite: true,
        speed: 800,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        arrows: true,
        fade: true,
        responsive: [
            {
                breakpoint: 768,
                settings: {
                    arrows: false,
                    centerMode: true,
                    centerPadding: '0px',
                }
            }
        ]
    }

    if (isLoading || !featuredReviews.length) return null

    return (
        <section className="py-24 bg-gray-50/50 relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="text-[10px] font-black uppercase tracking-[.4em] text-gray-400 mb-4 block"
                    >
                        Testimonials
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-6"
                    >
                        Community <span className="text-gray-400">Voice</span>
                    </motion.h2>
                    <div className="h-1.5 w-16 bg-black mx-auto rounded-full" />
                </div>

                <div className="relative">
                    <Slider {...settings} className="featured-reviews-slider">
                        {featuredReviews.map((review) => (
                            <div key={review._id} className="outline-none py-4">
                                <div className="bg-white border border-gray-100 p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-gray-200/20 flex flex-col items-center text-center">
                                    <div className="mb-8 flex flex-col items-center gap-4">
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={14}
                                                    className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-100'}
                                                />
                                            ))}
                                        </div>
                                        {review.title && (
                                            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900">
                                                {review.title}
                                            </h3>
                                        )}
                                    </div>

                                    <div className="relative mb-10 max-w-2xl mx-auto">
                                        <Quote className="absolute -top-6 -left-6 text-gray-50 h-12 w-12 -z-10" />
                                        <p className="text-gray-600 text-lg md:text-xl leading-relaxed italic font-medium">
                                            "{review.body || review.comment || ''}"
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-center gap-4 pt-8 border-t border-gray-50 w-full max-w-xs mx-auto">
                                        <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                                            {review.user?.avatar ? (
                                                <img src={review.user.avatar} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-50 uppercase font-black text-gray-300 text-sm">
                                                    {review.user?.name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 mb-1">{review.user?.name}</h4>
                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-600 bg-amber-50 px-3 py-1 rounded-full">Verified Customer</p>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">
                                            Purchased: <span className="text-gray-400">{review.product?.title}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Slider>
                </div>
            </div>

            <style jsx="true">{`
                .featured-reviews-slider {
                    padding: 0 52px;
                }
                .featured-reviews-slider .slick-dots {
                    bottom: -50px;
                }
                .featured-reviews-slider .slick-dots li button:before {
                    font-size: 10px;
                    color: #ddd;
                    opacity: 1;
                }
                .featured-reviews-slider .slick-dots li.slick-active button:before {
                    color: #000;
                }
                .featured-reviews-slider .slick-prev, 
                .featured-reviews-slider .slick-next {
                    z-index: 20;
                    width: 40px;
                    height: 40px;
                    background: white;
                    border-radius: 50%;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    display: flex !important;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                .featured-reviews-slider .slick-prev:hover, 
                .featured-reviews-slider .slick-next:hover {
                    background: black;
                    transform: scale(1.1);
                }
                .featured-reviews-slider .slick-prev:before, 
                .featured-reviews-slider .slick-next:before {
                    color: #bbb;
                    font-size: 20px;
                    transition: color 0.3s ease;
                }
                .featured-reviews-slider .slick-prev:hover:before, 
                .featured-reviews-slider .slick-next:hover:before {
                    color: white;
                }
                .featured-reviews-slider .slick-prev { left: 8px; }
                .featured-reviews-slider .slick-next { right: 8px; }
                
                @media (max-width: 1280px) {
                    .featured-reviews-slider {
                        padding: 0 44px;
                    }
                    .featured-reviews-slider .slick-prev { left: 6px; }
                    .featured-reviews-slider .slick-next { right: 6px; }
                }

                @media (max-width: 768px) {
                    .featured-reviews-slider {
                        padding: 0;
                    }
                }
            `}</style>
        </section>
    )
}
