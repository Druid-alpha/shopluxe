import React from 'react'
import { useNavigate } from 'react-router-dom'
import Slider from 'react-slick'
import { Laptop2, Shirt, ShoppingBasket, ArrowRight, Truck, ShieldCheck, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

import { useGetFeaturedProductsQuery } from '@/features/products/productApi'
import ProductCard from '@/features/products/ProductCard'
import { Button } from '@/components/ui/button'

import home from '../assets/women.jpg'
import grocery from '../assets/grocery.jpg'
import phone from '../assets/phone.jpg'
import delivery from '../assets/delivery.jpg'

// --- Animation Variants ---
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
}

const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
}

const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
}

export default function Home() {
  const navigate = useNavigate()
  const { data, isLoading } = useGetFeaturedProductsQuery()

  const slides = [
    {
      id: 1,
      image: phone,
      title: 'Next-Gen Electronics',
      description: 'Discover the latest technology designed to elevate your everyday life.',
      link: '/products?category=electronics',
    },
    {
      id: 2,
      image: home,
      title: 'Elevate Your Style',
      description: 'Explore curated fashion pieces that make a statement wherever you go.',
      link: '/products?category=clothing',
    },
    {
      id: 3,
      image: grocery,
      title: 'Freshness Delivered',
      description: 'Premium quality groceries brought straight to your doorstep.',
      link: '/products?category=groceries',
    },
  ]

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 5000,
    fade: true,
  }

  return (
    <div className="w-full">
      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-black pb-10 mb-16">
        <Slider {...sliderSettings} className="h-[40vh] min-h-[300px] md:h-[80vh] w-full">
          {slides.map(slide => (
            <div key={slide.id} className="relative h-[40vh] min-h-[300px] md:h-[80vh] w-full outline-none">
              <img
                src={slide.image}
                className="absolute inset-0 h-full w-full object-cover"
                alt={slide.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  variants={staggerContainer}
                  className="max-w-3xl"
                >
                  <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 drop-shadow-md">
                    {slide.title}
                  </motion.h1>
                  <motion.p variants={fadeUp} className="text-lg md:text-xl lg:text-2xl font-light text-gray-200 mb-8 drop-shadow-sm max-w-2xl mx-auto">
                    {slide.description}
                  </motion.p>
                  <motion.div variants={fadeUp}>
                    <Button
                      size="lg"
                      className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-6 rounded-full font-semibold transition-all hover:scale-105"
                      onClick={() => navigate(slide.link)}
                    >
                      Shop Collection <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          ))}
        </Slider>
      </section>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">

        {/* SHOP BY CATEGORY */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Shop by Category</h2>
            <div className="h-1 w-20 bg-black mx-auto mt-4 rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { id: 'electronics', icon: Laptop2, label: 'Electronics', color: 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300' },
              { id: 'clothing', icon: Shirt, label: 'Clothing', color: 'bg-rose-50 text-rose-600 border-rose-100 hover:border-rose-300' },
              { id: 'groceries', icon: ShoppingBasket, label: 'Groceries', color: 'bg-green-50 text-green-600 border-green-100 hover:border-green-300' }
            ].map(cat => (
              <motion.div key={cat.id} variants={scaleIn}>
                <div
                  onClick={() => navigate(`/products?category=${cat.id}`)}
                  className={`group relative flex flex-col items-center justify-center p-10 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${cat.color} hover:shadow-lg hover:-translate-y-1`}
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  <cat.icon className="h-16 w-16 mb-4 transition-transform group-hover:scale-110 duration-300" />
                  <span className="text-xl font-semibold tracking-wide">{cat.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* FEATURED PRODUCTS */}
        <section>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="flex justify-between items-end mb-10"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Featured Products</h2>
              <div className="h-1 w-20 bg-black mt-4 rounded-full"></div>
            </div>
            <Button variant="ghost" className="hidden md:flex font-semibold" onClick={() => navigate('/products')}>
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse border rounded-xl p-4 space-y-3">
                  <div className="h-48 bg-gray-200 rounded-lg w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mt-4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))
              : data?.products?.map(product => (
                <motion.div key={product._id} variants={fadeUp} className="h-full">
                  <ProductCard product={product} />
                </motion.div>
              ))
            }
          </motion.div>
          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" className="w-full" onClick={() => navigate('/products')}>
              View All Products
            </Button>
          </div>
        </section>

        {/* VALUE PROPOSITION GRID */}
        <section className="py-12 border-t border-b border-gray-100">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
          >
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On all orders over ₦50,000' },
              { icon: ShieldCheck, title: 'Secure Checkout', desc: '100% protected payments' },
              { icon: Clock, title: '24/7 Support', desc: 'Dedicated friendly assistance' }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeUp} className="flex flex-col items-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <feature.icon className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-500">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* PROMO SPLIT SECTION */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-12 items-center mb-24 overflow-hidden"
        >
          <motion.div variants={slideInLeft} className="relative group rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={delivery}
              className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
              alt="Fast Delivery"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
          </motion.div>

          <motion.div variants={slideInRight} className="space-y-6 md:pl-8">
            <span className="text-sm font-bold tracking-widest text-gray-500 uppercase">Premium Service</span>
            <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight">
              Fast, Reliable & <br />
              <span className="text-gray-400">Secure Delivery.</span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed max-w-md">
              Shop with absolute confidence knowing your luxury orders are handled with care and arrive right to your doorstep, exactly when you need them.
            </p>
            <div className="pt-4">
              <Button size="lg" className="bg-black text-white hover:bg-gray-800 text-lg px-8 py-6 rounded-xl font-medium shadow-lg" onClick={() => navigate('/products')}>
                Start Exploring
              </Button>
            </div>
          </motion.div>
        </motion.section>

      </div>
    </div>
  )
}