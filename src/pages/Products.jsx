import React, { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductFilters from '@/components/ProductFilters'
import ProductSearch from '@/components/ProductSearch'
import ProductCard from '@/features/products/ProductCard'
import { Button } from '@/components/ui/button'
import { useGetProductsQuery } from '@/features/products/productApi'
import { SlidersHorizontal, X } from 'lucide-react'
import clsx from 'clsx'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [brand, setBrand] = useState(searchParams.get('brand') || '')
  const [color, setColor] = useState(searchParams.get('color') || '')
  const [minPrice, setMinPrice] = useState(Number(searchParams.get('minPrice')) || 0)
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get('maxPrice')) || 5000000)
  const [clothingType, setClothingType] = useState(searchParams.get('clothingType') || '')
  const [mobileFilters, setMobileFilters] = useState(false)

  // ---------------- Debounced search ----------------
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  // ---------------- Reset dependent filters ----------------
  useEffect(() => {
    // Reset clothingType and brand if category changes
    setClothingType('')
    setBrand('')
  }, [category])

  useEffect(() => {
    // Reset brand if clothingType changes
    setBrand('')
  }, [clothingType])

  // ---------------- Update URL ----------------
  useEffect(() => {
    const params = {
      page: page.toString(),
      search: debouncedSearch || '',
      category: category || '',
      clothingType: clothingType || '',
      brand: brand || '',
      color: color || '',
      minPrice,
      maxPrice,
    }
    setSearchParams(params)
  }, [page, debouncedSearch, category, clothingType, brand, color, minPrice, maxPrice])

  // ---------------- Mobile scroll lock ----------------
  useEffect(() => {
    document.body.style.overflow = mobileFilters ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileFilters])

  // ---------------- Fetch products ----------------
  const { data, isLoading } = useGetProductsQuery({
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    category: category || undefined,
    brand: brand || undefined,
    color: color || undefined,
    clothingType: clothingType || undefined, // ⚡ important for clothing
    minPrice,
    maxPrice,
  })

  const totalPages = data?.pages ?? 1

  return (
    <section className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">All Products</h1>
        <Button variant="outline" className="lg:hidden flex gap-2" onClick={() => setMobileFilters(true)}>
          <SlidersHorizontal size={16} />
          Filters
        </Button>
      </div>

      <div className="flex justify-center lg:justify-start mb-4">
        <div className="w-full lg:w-72">
          <ProductSearch search={search} setSearch={setSearch} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Filters */}
        <aside className="hidden lg:block border rounded-lg p-4 h-fit sticky top-20">
          <ProductFilters
            category={category} setCategory={setCategory}
            brand={brand} setBrand={setBrand}
            color={color} setColor={setColor}
            minPrice={minPrice} setMinPrice={setMinPrice}
            maxPrice={maxPrice} setMaxPrice={setMaxPrice}
            clothingType={clothingType} setClothingType={setClothingType}
          />
        </aside>

        {/* Products */}
        <div className="lg:col-span-3">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {isLoading
              ? Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse border rounded-lg p-4 space-y-3">
                  <div className="h-40 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))
              : data?.products?.map(product => (
                <ProductCard key={product._id} product={product} />
              ))
            }
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4 mt-10">
            <Button disabled={page <= 1} onClick={() => {
              setPage(p => Math.max(1, p - 1))
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}>Prev</Button>
            <span className="px-4 py-2 border rounded">Page {page} of {totalPages}</span>
            <Button disabled={page >= totalPages} onClick={() => {
              setPage(p => Math.min(totalPages, p + 1))
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}>Next</Button>
          </div>
        </div>
      </div>

      {/* Mobile filters */}
      <div className={clsx('fixed inset-0 z-50 lg:hidden transition-opacity duration-300',
        mobileFilters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilters(false)} />
        <div className={clsx('absolute right-0 top-0 h-full w-72 bg-white p-4 overflow-y-auto transform transition-transform duration-300',
          mobileFilters ? 'translate-x-0' : 'translate-x-full')}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Filters</h2>
            <X onClick={() => setMobileFilters(false)} className="cursor-pointer" />
          </div>
          <ProductFilters
            category={category} setCategory={setCategory}
            brand={brand} setBrand={setBrand}
            color={color} setColor={setColor}
            minPrice={minPrice} setMinPrice={setMinPrice}
            maxPrice={maxPrice} setMaxPrice={setMaxPrice}
            clothingType={clothingType} setClothingType={setClothingType}
          />
        </div>
      </div>
    </section>
  )
}
