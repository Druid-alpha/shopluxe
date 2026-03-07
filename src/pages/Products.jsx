import * as React from 'react'
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
  const MAX_PRICE = 5000000
  const normalizeClothingType = React.useCallback((type) => {
    if (!type) return ''
    return type === 'bags' ? 'bag' : type
  }, [])

  const [page, setPage] = React.useState(Number(searchParams.get('page')) || 1)
  const [search, setSearch] = React.useState(searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = React.useState(search)
  const [category, setCategory] = React.useState(searchParams.get('category') || '')
  const [brand, setBrand] = React.useState(searchParams.get('brand') || null)
  const [color, setColor] = React.useState(searchParams.get('color') || null)
  const [minPrice, setMinPrice] = React.useState(Number(searchParams.get('minPrice')) || 0)
  const [maxPrice, setMaxPrice] = React.useState(Number(searchParams.get('maxPrice')) || MAX_PRICE)
  const [clothingType, setClothingType] = React.useState(normalizeClothingType(searchParams.get('clothingType') || ''))
  const [availability, setAvailability] = React.useState(searchParams.get('availability') || null)
  const [sortBy, setSortBy] = React.useState(searchParams.get('sortBy') || 'newest')
  const [mobileFilters, setMobileFilters] = React.useState(false)

  // ---------------- Debounced search ----------------
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  // ---------------- Reset dependent filters ----------------
  React.useEffect(() => {
    // Reset clothingType and brand if category changes
    setClothingType('')
    setBrand(null)
  }, [category])

  React.useEffect(() => {
    // Reset brand if clothingType changes
    setBrand(null)
  }, [clothingType])

  // ---------------- Reset page on ALL filter changes ----------------
  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, category, brand, color, clothingType, minPrice, maxPrice, availability, sortBy])

  // ---------------- Update URL ----------------
  React.useEffect(() => {
    const params = {
      page: page.toString(),
      search: debouncedSearch || '',
      category: category || '',
      clothingType: normalizeClothingType(clothingType) || '',
      brand: brand || '',
      color: color || '',
      minPrice,
      maxPrice,
      availability: availability || '',
      sortBy,
    }
    setSearchParams(params)
  }, [page, debouncedSearch, category, clothingType, brand, color, minPrice, maxPrice, availability, sortBy, normalizeClothingType])

  // ---------------- Mobile scroll lock ----------------
  React.useEffect(() => {
    document.body.style.overflow = mobileFilters ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileFilters])

  // ---------------- Fetch products ----------------
  const { data, isLoading, isFetching } = useGetProductsQuery({
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    category: category || undefined,
    brand: brand || undefined,
    color: color || undefined,
    clothingType: normalizeClothingType(clothingType) || undefined,
    minPrice,
    maxPrice,
    availability: availability || undefined,
    sortBy,
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="w-full lg:w-72">
          <ProductSearch search={search} setSearch={setSearch} />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-[10px] font-black uppercase tracking-widest border-0 border-b-2 border-black focus:ring-0 cursor-pointer bg-transparent py-1 pr-8"
          >
            <option value="newest">Latest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
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
            availability={availability} setAvailability={setAvailability}
          />
        </aside>

        {/* Products */}
        <div className="lg:col-span-3">
          <div className={clsx("grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 transition-opacity duration-150", isFetching && !isLoading ? "opacity-70" : "opacity-100")}>
            {(isLoading || isFetching)
              ? Array.from({ length: 12 }).map((_, idx) => (
                <div key={`skeleton-${idx}`} className="animate-pulse border rounded-lg p-4 space-y-3">
                  <div className="h-40 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))
              : data?.products?.length > 0
                ? data.products.map((product) => (
                  <div key={product._id}>
                    <ProductCard product={product} />
                  </div>
                ))
                : (
                  <div className="col-span-full py-20 text-center space-y-4">
                    <p className="text-gray-400 text-lg font-medium">
                      {data?.message || 'No products found for the selected filters.'}
                    </p>
                    <Button variant="outline" onClick={() => {
                      setCategory('')
                      setBrand(null)
                      setColor(null)
                      setSearch('')
                      setClothingType('')
                      setAvailability(null)
                      setSortBy('newest')
                      setMinPrice(0)
                      setMaxPrice(MAX_PRICE)
                    }}>Clear All Filters</Button>
                  </div>
                )}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4 mt-10">
            <Button disabled={page <= 1 || isFetching} onClick={() => {
              setPage(p => Math.max(1, p - 1))
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}>Prev</Button>
            <span className="px-4 py-2 border rounded">Page {page} of {totalPages}</span>
            <Button disabled={page >= totalPages || isFetching} onClick={() => {
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
            availability={availability} setAvailability={setAvailability}
          />
        </div>
      </div>
    </section>
  )
}
