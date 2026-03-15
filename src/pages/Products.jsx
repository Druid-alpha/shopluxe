import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductFilters from '@/components/ProductFilters'
import ProductSearch from '@/components/ProductSearch'
import ProductCard from '@/features/products/ProductCard'
import { Button } from '@/components/ui/button'
import { useGetProductsQuery } from '@/features/products/productApi'
import axios from '@/lib/axios'
import { SlidersHorizontal, X } from 'lucide-react'
import clsx from 'clsx'
import RecentlyViewed from '@/components/RecentlyViewed'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const MAX_PRICE = 5000000
  const normalizeClothingType = React.useCallback((type) => {
    if (!type) return ''
    return type === 'bag' ? 'bags' : type
  }, [])
  const isObjectId = React.useCallback((value) => /^[a-fA-F0-9]{24}$/.test(String(value || '')), [])
  const normalizeCategoryLabel = React.useCallback((value) => {
    const cleaned = String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '')
    if (!cleaned) return ''
    if (cleaned.endsWith('ies')) return `${cleaned.slice(0, -3)}y`
    if (cleaned.endsWith('s')) return cleaned.slice(0, -1)
    return cleaned
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
  const [saleOnly, setSaleOnly] = React.useState(
    ['1', 'true', 'yes'].includes(String(searchParams.get('sale') || '').toLowerCase())
  )
  const [mobileFilters, setMobileFilters] = React.useState(false)
  const [isResolvingCategory, setIsResolvingCategory] = React.useState(false)
  const skipNextUrlSyncRef = React.useRef(false)
  const quickSuggestions = React.useMemo(() => ([
    'Sale',
    'New Arrivals',
    'Bags',
    'Shoes',
    'Electronics',
    'Under 50k'
  ]), [])
  const setMeta = React.useCallback((name, content) => {
    if (!content) return
    let tag = document.querySelector(`meta[name="${name}"]`)
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', name)
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', content)
  }, [])

  // Keep local state in sync when URL params change externally (e.g. navbar/home category links).
  React.useEffect(() => {
    skipNextUrlSyncRef.current = true
    const nextPage = Number(searchParams.get('page')) || 1
    const nextSearch = searchParams.get('search') || ''
    const nextCategory = searchParams.get('category') || ''
    const nextBrand = searchParams.get('brand') || null
    const nextColor = searchParams.get('color') || null
    const nextMinPrice = Number(searchParams.get('minPrice')) || 0
    const nextMaxPrice = Number(searchParams.get('maxPrice')) || MAX_PRICE
    const nextClothingType = normalizeClothingType(searchParams.get('clothingType') || '')
    const nextAvailability = searchParams.get('availability') || null
    const nextSortBy = searchParams.get('sortBy') || 'newest'
    const nextSaleOnly = ['1', 'true', 'yes'].includes(String(searchParams.get('sale') || '').toLowerCase())

    setPage((prev) => (prev === nextPage ? prev : nextPage))
    setSearch((prev) => (prev === nextSearch ? prev : nextSearch))
    setDebouncedSearch((prev) => (prev === nextSearch ? prev : nextSearch))
    setCategory((prev) => (prev === nextCategory ? prev : nextCategory))
    setBrand((prev) => (prev === nextBrand ? prev : nextBrand))
    setColor((prev) => (prev === nextColor ? prev : nextColor))
    setMinPrice((prev) => (prev === nextMinPrice ? prev : nextMinPrice))
    setMaxPrice((prev) => (prev === nextMaxPrice ? prev : nextMaxPrice))
    setClothingType((prev) => (prev === nextClothingType ? prev : nextClothingType))
    setAvailability((prev) => (prev === nextAvailability ? prev : nextAvailability))
    setSortBy((prev) => (prev === nextSortBy ? prev : nextSortBy))
    setSaleOnly((prev) => (prev === nextSaleOnly ? prev : nextSaleOnly))
  }, [searchParams, normalizeClothingType])

  React.useEffect(() => {
    let cancelled = false

    const resolveCategory = async () => {
      if (!category || isObjectId(category)) {
        setIsResolvingCategory(false)
        return
      }

      setIsResolvingCategory(true)
      try {
        const res = await axios.get('/products/filters')
        const categories = res?.data?.categories || []
        const incoming = normalizeCategoryLabel(category)
        const match = categories.find((c) => normalizeCategoryLabel(c?.name) === incoming)
        if (!cancelled) {
          if (match?._id) setCategory(String(match._id))
          setIsResolvingCategory(false)
        }
      } catch {
        if (!cancelled) setIsResolvingCategory(false)
      }
    }

    resolveCategory()
    return () => { cancelled = true }
  }, [category, isObjectId, normalizeCategoryLabel])

  // ---------------- Debounced search ----------------
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  // ---------------- Reset dependent filters ----------------
  React.useEffect(() => {
    // Reset clothingType and brand if category changes
    setClothingType((prev) => (prev === '' ? prev : ''))
    setBrand((prev) => (prev === null ? prev : null))
  }, [category])

  React.useEffect(() => {
    // Reset brand if clothingType changes
    setBrand((prev) => (prev === null ? prev : null))
  }, [clothingType])

  // ---------------- Reset page on filter changes ONLY ----------------
  const prevFiltersRef = React.useRef({ debouncedSearch, category, brand, color, clothingType, minPrice, maxPrice, availability, sortBy, saleOnly })
  React.useEffect(() => {
    const currentFilters = { debouncedSearch, category, brand, color, clothingType, minPrice, maxPrice, availability, sortBy, saleOnly }
    const filtersChanged = Object.keys(currentFilters).some(key => currentFilters[key] !== prevFiltersRef.current[key])

    if (filtersChanged) {
      setPage(1)
      prevFiltersRef.current = currentFilters
    }
  }, [debouncedSearch, category, brand, color, clothingType, minPrice, maxPrice, availability, sortBy, saleOnly])

  // ---------------- Update URL ----------------
  React.useEffect(() => {
    if (skipNextUrlSyncRef.current) {
      skipNextUrlSyncRef.current = false
      return
    }

    const next = new URLSearchParams({
      page: page.toString(),
      search: debouncedSearch || '',
      category: category || '',
      clothingType: normalizeClothingType(clothingType) || '',
      brand: brand || '',
      color: color || '',
      minPrice: String(minPrice),
      maxPrice: String(maxPrice),
      availability: availability || '',
      sortBy,
      sale: saleOnly ? '1' : '',
    })

    const current = searchParams.toString()
    const target = next.toString()
    if (current !== target) {
      // Use replace: false for page changes to support the browser's back button
      const isPageChangeOnly = current.replace(/page=\d+/, '') === target.replace(/page=\d+/, '')
      setSearchParams(next, { replace: !isPageChangeOnly })
    }
  }, [page, debouncedSearch, category, clothingType, brand, color, minPrice, maxPrice, availability, sortBy, saleOnly, normalizeClothingType, searchParams, setSearchParams])

  // ---------------- Mobile scroll lock ----------------
  React.useEffect(() => {
    document.body.style.overflow = mobileFilters ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileFilters])

  React.useEffect(() => {
    const activeCategory = options.categories.find(c => c._id === category)?.name || ''
    const titleParts = [
      search ? `Search: ${search}` : '',
      activeCategory || '',
      saleOnly ? 'On Sale' : '',
      'ShopLuxe'
    ].filter(Boolean)
    document.title = titleParts.join(' · ')
    setMeta('description', 'Browse curated products, filter by category, and find deals at ShopLuxe.')
  }, [search, category, saleOnly, options.categories, setMeta])

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
    onSale: saleOnly ? true : undefined,
  }, { skip: isResolvingCategory })

  const totalPages = data?.pages ?? 1
  const filteredProducts = React.useMemo(() => {
    const list = data?.products || []
    if (!saleOnly) return list
    return list.filter((p) => Number(p?.discount || 0) > 0)
  }, [data?.products, saleOnly])

  const handleSuggestion = (raw) => {
    const value = String(raw || '').trim().toLowerCase()
    if (!value) return

    if (value.includes('sale')) {
      setSaleOnly(true)
      setSearch('')
      return
    }

    if (saleOnly) setSaleOnly(false)

    if (value.includes('latest') || value.includes('new')) {
      setSortBy('newest')
      setSearch('')
      return
    }

    if (value.includes('bags')) {
      setCategory('clothing')
      setClothingType('bags')
      setSearch('')
      return
    }

    if (value.includes('shoes')) {
      setCategory('clothing')
      setClothingType('shoes')
      setSearch('')
      return
    }

    if (value.includes('electronics')) {
      setCategory('electronics')
      setClothingType('')
      setSearch('')
      return
    }

    const underMatch = value.match(/under\s+(\d+)(k)?/)
    if (underMatch) {
      const amount = Number(underMatch[1]) * (underMatch[2] ? 1000 : 1)
      setMinPrice(0)
      setMaxPrice(amount || MAX_PRICE)
      setSearch('')
      return
    }

    setSearch(raw)
  }

  return (
    <section className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold font-display">All Products</h1>
        <Button variant="outline" className="lg:hidden flex gap-2" onClick={() => setMobileFilters(true)}>
          <SlidersHorizontal size={16} />
          Filters
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="w-full lg:w-72">
          <ProductSearch
            search={search}
            setSearch={setSearch}
            onSuggestion={handleSuggestion}
            suggestions={quickSuggestions}
          />
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
            saleOnly={saleOnly} setSaleOnly={setSaleOnly}
            onClearAll={() => setSaleOnly(false)}
          />
        </aside>

        {/* Products */}
        <div className="lg:col-span-3">
          <div className={clsx("grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:block lg:columns-3 lg:gap-6 lg:space-y-6 transition-opacity duration-150", (isFetching || isResolvingCategory) && !isLoading ? "opacity-70" : "opacity-100")}>
            {(isResolvingCategory || isLoading || isFetching)
              ? Array.from({ length: 12 }).map((_, idx) => (
                <div key={`skeleton-${idx}`} className="animate-pulse border rounded-lg p-4 space-y-3 lg:break-inside-avoid">
                  <div className="h-40 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))
              : filteredProducts?.length > 0
                ? filteredProducts.map((product) => (
                  <div key={product._id} className="lg:break-inside-avoid lg:mb-6 h-full">
                    <ProductCard product={product} />
                  </div>
                ))
                : (
                  <div className="col-span-full py-20 text-center space-y-4">
                    <p className="text-gray-400 text-lg font-medium">
                      {data?.message || 'No products found for the selected filters.'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {quickSuggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSuggestion(s)}
                          className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-gray-200 text-gray-500 hover:text-black hover:border-black transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
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
                      setSaleOnly(false)
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

          <div className="mt-16">
            <RecentlyViewed title="Keep Browsing" />
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
            saleOnly={saleOnly} setSaleOnly={setSaleOnly}
            onClearAll={() => setSaleOnly(false)}
          />
        </div>
      </div>
    </section>
  )
}
