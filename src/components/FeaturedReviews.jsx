import React from 'react'
import { useGetFeaturedReviewsQuery } from '@/features/products/productApi'
import { Star, Quote, User } from 'lucide-react'
import { motion } from 'framer-motion'
import Slider from 'react-slick'

export default function FeaturedReviews() {
    const { data, isLoading } = useGetFeaturedReviewsQuery()

    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 4000,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2,
                }
            },
            {
                breakpoint: 640,
                settings: {
                    slidesToShow: 1,
                }
            }
        ]
    }

    if (isLoading || !data?.reviews?.length) return null

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gray-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-50" />

            <div className="max-w-7xl mx-auto px-4 relative z-10">
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
                        What Our <span className="text-gray-400">Community Says</span>
                    </motion.h2>
                    <div className="h-1.5 w-24 bg-black mx-auto rounded-full" />
                </div>

                <Slider {...settings} className="featured-reviews-slider">
                    {data.reviews.map((review) => (
                        <div key={review._id} className="px-2 py-4">
                            <div className="bg-white border border-gray-100 p-6 md:p-8 rounded-[2rem] h-full flex flex-col hover:border-black transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 group">
                                <div className="mb-6 flex justify-between items-start">
                                    <Quote className="text-gray-100 group-hover:text-black transition-colors duration-500 h-8 w-8 mt-[-10px]" />
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={10}
                                                className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-100'}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-8 italic flex-1 line-clamp-4">
                                    "{review.body}"
                                </p>

                                <div className="flex items-center gap-3 mt-auto pt-6 border-t border-gray-50 overflow-hidden">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-xl flex-shrink-0 bg-gray-50 flex items-center justify-center">
                                        {review.user?.avatar ? (
                                            <img src={review.user.avatar} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={14} className="text-gray-300" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900 mb-0.5 truncate">{review.user?.name}</h4>
                                        <p className="text-[7px] font-black uppercase tracking-[.2em] text-gray-400">Verified Customer</p>
                                    </div>
                                    <div className="ml-auto flex-shrink-0">
                                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">PURCHASED: {review.product?.title?.substring(0, 15)}...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </Slider>
            </div>

            <style jsx="true">{`
        .featured-reviews-slider .slick-dots li button:before {
          font-size: 8px;
          color: #eee;
          opacity: 1;
        }
        .featured-reviews-slider .slick-dots li.slick-active button:before {
          color: #000;
        }
        .featured-reviews-slider .slick-dots {
            bottom: -40px;
        }
        .slick-list {
            margin: 0 -8px;
        }
        .slick-slide > div {
            padding: 0 8px;
        }
      `}</style>
        </section>
    )
}
