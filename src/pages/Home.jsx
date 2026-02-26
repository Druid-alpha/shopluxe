import React from 'react'
import { useNavigate } from 'react-router-dom'
import Slider from 'react-slick'
import { Laptop2, Shirt, ShoppingBasket } from 'lucide-react'

import { useGetFeaturedProductsQuery } from '@/features/products/productApi'
import ProductCard from '@/features/products/ProductCard'
import { Button } from '@/components/ui/button'

import home from '../assets/women.jpg'
import grocery from '../assets/grocery.jpg'
import phone from '../assets/phone.jpg'
import shopping from '../assets/shopping.jpg'
import delivery from '../assets/delivery.jpg'
import hoodie from '../assets/hoodie.jpg'
import headphone from '../assets/headphone.jpg'

export default function Home() {
  const navigate = useNavigate()
  const { data, isLoading } = useGetFeaturedProductsQuery()

  const slides = [
    {
      id: 1,
      image: phone,
      title: 'Exclusive Deals on Electronics',
      description: 'Upgrade your tech with the latest innovations',
      link: '/products?category=electronics',
    },
    {
      id: 2,
      image: home,
      title: 'Latest Fashion Collections',
      description: 'Modern styles curated just for you',
      link: '/products?category=clothing',
    },
    {
      id: 3,
      image: grocery,
      title: 'Fresh Groceries, Fast Delivery',
      description: 'Quality products you can trust, every day',
      link: '/products?category=groceries',
    },
  ]

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 4000,
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* HERO */}
      <section className="mb-16">
        <Slider {...sliderSettings}>
          {slides.map(slide => (
            <div key={slide.id} className="relative">
              <img
                src={slide.image}
                className="h-[520px] w-full object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black/50 rounded-xl" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
                <h1 className="text-4xl md:text-5xl font-bold">
                  {slide.title}
                </h1>
                <p className="mt-4 max-w-xl text-lg">
                  {slide.description}
                </p>
                <Button
                  className="mt-6 bg-white text-black"
                  onClick={() => navigate(slide.link)}
                >
                  Shop Now
                </Button>
              </div>
            </div>
          ))}
        </Slider>
      </section>

      {/* CATEGORIES */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="py-8 text-lg"
            onClick={() => navigate('/products?category=electronics')}
          >
            <Laptop2 className="mr-2" /> Electronics
          </Button>

          <Button
            variant="outline"
            className="py-8 text-lg"
            onClick={() => navigate('/products?category=clothing')}
          >
            <Shirt className="mr-2" /> Clothing
          </Button>

          <Button
            variant="outline"
            className="py-8 text-lg"
            onClick={() => navigate('/products?category=groceries')}
          >
            <ShoppingBasket className="mr-2" /> Groceries
          </Button>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold mb-6">Featured Products</h2>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {!isLoading &&
            data?.products?.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
        </div>
      </section>

      {/* PROMO */}
      <section className="mb-20 grid md:grid-cols-2 gap-10 items-center">
        <img
          src={delivery}
          className="rounded-xl shadow-md"
        />
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">
            Fast & Reliable Delivery
          </h2>
          <p className="text-gray-600">
            Shop confidently knowing your orders arrive safely and on time.
          </p>
          <Button onClick={() => navigate('/products')}>
            Start Shopping
          </Button>
        </div>
      </section>
    </div>
  )
}