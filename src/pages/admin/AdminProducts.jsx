import React, { useEffect, useRef, useState, useCallback } from 'react'
import Select from 'react-select'
import axios from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

import {
  useGetAdminProductsQuery,
  useDeleteProductMutation,
  useRestoreProductMutation,
  useHardDeleteProductMutation,
  useHardDeleteAllProductsMutation,
  useToggleFeaturedMutation,
  useUpdateProductMutation,
  useUpdateProductVariantsMutation,
} from '@/features/products/productApi'
import ProductForm from './ProductForm'
import Modal from './Modal'
import { Star, Edit, Trash2, RotateCcw, Trash, RefreshCw, PackagePlus } from 'lucide-react'

export default function AdminProducts() {
  const LOW_STOCK_THRESHOLD = 5
  const [toggleFeatured] = useToggleFeaturedMutation()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [editingProduct, setEditingProduct] = useState(null)
  const [restockProduct, setRestockProduct] = useState(null)
  const [restockStock, setRestockStock] = useState('')
  const [restockBaseStock, setRestockBaseStock] = useState('')
  const [restockBasePrice, setRestockBasePrice] = useState('')
  const [restockBaseDiscount, setRestockBaseDiscount] = useState('')
  const [restockVariants, setRestockVariants] = useState([])
  const [restockLoadingDetails, setRestockLoadingDetails] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    brand: '',
    color: '',
    clothingType: '',
    onSale: false,
  })
  const [searchInput, setSearchInput] = useState('')
  const [options, setOptions] = useState({
    categories: [],
    brands: [],
    colors: [],
    sizeOptions: [],
    sizeOptionsByClothingType: {
      clothes: [],
      shoes: [],
      bags: [],
      eyeglass: [],
    },
  })
  const filterOptionsCacheRef = useRef(new Map())
  const colorNameById = React.useMemo(() => {
    const map = new Map()
    ;(options.colors || []).forEach(c => {
      if (!c?._id) return
      map.set(String(c._id), c.name || c.hex || String(c._id))
    })
    return map
  }, [options.colors])
  const formatVariantColor = (raw, label) => {
    if (label) return `Color: ${label}`
    if (!raw) return 'Color: -'
    const key = String(raw)
    const resolvedLabel = colorNameById.get(key) || key
    return `Color: ${resolvedLabel}`
  }
  const listTopRef = useRef(null)
  const scrollToListTop = useCallback(() => {
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  /* ================= ADMIN QUERY ================= */
  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdminProductsQuery(
    {
      page,
      limit: 10,
      search: filters.search || undefined,
      category: filters.category || undefined,
      brand: filters.brand || undefined,
      color: filters.color || undefined,
      clothingType: filters.clothingType || undefined,
      onSale: filters.onSale ? true : undefined,
    },
    { refetchOnMountOrArgChange: true }
  )
  const products =
    data?.products?.docs ||
    data?.data?.products?.docs ||
    data?.products ||
    data?.data?.products ||
    data?.items ||
    data?.results ||
    []
  const totalPages =
    data?.pages ||
    data?.totalPages ||
    data?.products?.totalPages ||
    data?.data?.pages ||
    data?.data?.totalPages ||
    data?.data?.products?.totalPages ||
    1

  /* ================= ADMIN MUTATIONS ================= */
  const [deleteProduct] = useDeleteProductMutation()
  const [restoreProduct] = useRestoreProductMutation()
  const [hardDeleteProduct] = useHardDeleteProductMutation()
  const [hardDeleteAllProducts] = useHardDeleteAllProductsMutation()
  const [updateProduct, { isLoading: isUpdatingProduct }] = useUpdateProductMutation()
  const [updateProductVariants, { isLoading: isUpdatingVariants }] = useUpdateProductVariantsMutation()

  /* ================= FILTER OPTIONS ================= */
  const loadFilters = async () => {
    try {
      const cacheKey = `${filters.category || 'all'}|${filters.clothingType || 'all'}`
      const cached = filterOptionsCacheRef.current.get(cacheKey)
      if (cached) {
        setOptions(cached)
        return
      }

      const res = await axios.get('/products/filters', {
        params: {
          category: filters.category,
          clothingType: filters.clothingType,
          includeAllBrands: true
        },
      })
      const mergeById = (prevList, nextList) => {
        const map = new Map()
        ;[...(prevList || []), ...(nextList || [])].forEach((item) => {
          if (item?._id) map.set(item._id, item)
        })
        return Array.from(map.values())
      }
      const rawColors = res.data.colors || []
      const seenColorKeys = new Set()
      const normalizedColors = rawColors.filter(c => {
        if (!c || (!c.name && !c.hex)) return false
        const key = String(c.hex || c.name || c._id || '').toLowerCase()
        if (!key || seenColorKeys.has(key)) return false
        seenColorKeys.add(key)
        return true
      })

      const nextOptions = {
        categories: mergeById(options.categories, res.data.categories || []),
        brands: res.data.brands || [],
        colors: normalizedColors.slice(0, 10),
        sizeOptions: res.data.sizeOptions || [],
        sizeOptionsByClothingType: res.data.sizeOptionsByClothingType || {
          clothes: [],
          shoes: [],
          bags: [],
          eyeglass: [],
        },
      }
      filterOptionsCacheRef.current.set(cacheKey, nextOptions)
      setOptions(nextOptions)
    } catch (err) {
      console.error('Failed to load admin filters', err)
      toast({ title: 'Failed to load filters', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadFilters()
  }, [filters.category, filters.clothingType])

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => {
        if (prev.search === searchInput) return prev
        return { ...prev, search: searchInput }
      })
      setPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value || '' }))
    setPage(1)
  }

  const resetFilters = () => {
    setSearchInput('')
    setFilters({ search: '', category: '', brand: '', color: '', clothingType: '', onSale: false })
    setPage(1)
  }

  /* ================= ACTIONS ================= */
  const handleSoftDelete = async id => {
    try {
      await deleteProduct(id).unwrap()
      toast({ title: 'Product soft-deleted', variant: 'destructive' })
      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Delete failed',
        variant: 'destructive',
      })
    }
  }
  const handleToggleFeatured = async (product) => {
    try {
      await toggleFeatured({
        id: product._id,
        featured: !product.featured,
      }).unwrap()

      toast({
        title: product.featured
          ? 'Removed from featured'
          : 'Marked as featured',
      })

      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to update featured',
        variant: 'destructive',
      })
    }
  }
  const handleRestore = async id => {
    try {
      await restoreProduct(id).unwrap()
      toast({ title: 'Product restored', variant: 'success' })
      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Restore failed',
        variant: 'destructive',
      })
    }
  }

  const handleHardDelete = async id => {
    try {
      await hardDeleteProduct(id).unwrap()
      toast({ title: 'Product permanently deleted', variant: 'destructive' })
      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Hard delete failed',
        variant: 'destructive',
      })
    }
  }

  const handleHardDeleteAll = async () => {
    try {
      await hardDeleteAllProducts().unwrap()
      toast({
        title: 'All soft-deleted products permanently deleted',
        variant: 'destructive',
      })
      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Hard delete all failed',
        variant: 'destructive',
      })
    }
  }

  const handleExport = async () => {
    try {
      const res = await axios.get('/admin/export/products', { responseType: 'blob' })
      const blob = res.data
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `products-${Date.now()}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast({ title: 'Export failed', description: err.message || 'Could not export products', variant: 'destructive' })
    }
  }

  const handleResetReservation = async (product) => {
    if (!product?._id) return
    try {
      await axios.post('/admin/reservations/reset-product', { productId: product._id })
      toast({ title: 'Reservation reset', description: product.title })
      refetch()
    } catch (err) {
      toast({
        title: 'Reset failed',
        description: err?.response?.data?.message || 'Could not reset reservations',
        variant: 'destructive',
      })
    }
  }
  const openRestockModal = (product) => {
    if (!product?._id) return
    setRestockProduct(product)
    setRestockBaseStock(String(product.stock ?? 0))
    setRestockBasePrice(String(product.price ?? 0))
    setRestockBaseDiscount(String(product.discount ?? 0))
    if (product.variants?.length) {
      const normalized = product.variants.map((v) => ({
        _id: v._id,
        sku: v.sku || '',
        options: {
          color: v.options?.color?._id || v.options?.color || '',
          size: v.options?.size || ''
        },
        price: Number(v.price || 0),
        discount: Number(v.discount || 0),
        stock: Number(v.stock || 0)
      }))
      setRestockVariants(normalized)
      setRestockStock('')
    } else {
      setRestockStock(String(product.stock ?? 0))
      setRestockVariants([])
    }

    // Fetch full product details to resolve color names for variants.
    setRestockLoadingDetails(true)
    axios.get(`/products/${product._id}`)
      .then((res) => {
        const detailed = res.data?.product
        if (!detailed?.variants?.length) return
        const colorLabelById = new Map()
        detailed.variants.forEach((v) => {
          const colorObj = v?.options?.color
          const colorId = colorObj?._id ? String(colorObj._id) : null
          const colorLabel = colorObj?.name || colorObj?.hex || null
          if (colorId && colorLabel) colorLabelById.set(colorId, colorLabel)
        })
        setRestockVariants((prev) => prev.map((v) => {
          const colorId = v.options?.color ? String(v.options.color) : ''
          const colorLabel = colorId ? (colorLabelById.get(colorId) || v.colorLabel) : v.colorLabel
          return { ...v, colorLabel }
        }))
      })
      .catch(() => {
        // Silent fail: fallback to IDs if needed.
      })
      .finally(() => setRestockLoadingDetails(false))
  }
  const closeRestockModal = () => {
    setRestockProduct(null)
    setRestockStock('')
    setRestockBaseStock('')
    setRestockBasePrice('')
    setRestockBaseDiscount('')
    setRestockVariants([])
  }
  const handleRestockSave = async () => {
    if (!restockProduct?._id) return
    try {
      if (restockProduct.variants?.length) {
        const fdBase = new FormData()
        fdBase.append('payload', JSON.stringify({
          stock: Math.max(0, Number(restockBaseStock || 0)),
          price: Math.max(0, Number(restockBasePrice || 0)),
          discount: Math.max(0, Math.min(100, Number(restockBaseDiscount || 0)))
        }))
        await updateProduct({ id: restockProduct._id, formData: fdBase }).unwrap()

        const payloadVariants = restockVariants.map((v) => ({
          _id: v._id,
          sku: v.sku,
          options: {
            color: v.options?.color || undefined,
            size: v.options?.size || undefined
          },
          price: Math.max(0, Number(v.price || 0)),
          discount: Math.max(0, Math.min(100, Number(v.discount || 0))),
          stock: Math.max(0, Number(v.stock || 0))
        }))
        const fd = new FormData()
        fd.append('payload', JSON.stringify({ variants: payloadVariants }))
        await updateProductVariants({ id: restockProduct._id, formData: fd }).unwrap()
      } else {
        const fd = new FormData()
        fd.append('payload', JSON.stringify({
          stock: Math.max(0, Number(restockStock || 0)),
          price: Math.max(0, Number(restockBasePrice || 0)),
          discount: Math.max(0, Math.min(100, Number(restockBaseDiscount || 0)))
        }))
        await updateProduct({ id: restockProduct._id, formData: fd }).unwrap()
      }
      toast({ title: 'Stock updated', description: restockProduct.title })
      closeRestockModal()
      refetch()
    } catch (err) {
      toast({
        title: 'Restock failed',
        description: err?.data?.message || err?.message || 'Could not update stock',
        variant: 'destructive'
      })
    }
  }

  if (isLoading && !data) return <p>Loading products...</p>
  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load products: {error?.data?.message || 'Please check admin auth/session and API route.'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isFetching && (
        <div className="text-xs text-gray-500 font-medium">Refreshing products...</div>
      )}
      {/* FILTERS & ACTIONS */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900">Filters & Inventory</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={() => setEditingProduct({})} className="bg-black hover:bg-gray-800 rounded-xl w-full sm:w-auto">
              + Create Product
            </Button>
            <Button variant="outline" className="rounded-xl w-full sm:w-auto" onClick={handleExport}>
              Export Products
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
              onClick={async () => {
                try {
                  await axios.post('/admin/reservations/reset-all')
                  toast({ title: 'All reservations reset' })
                  refetch()
                } catch (err) {
                  toast({
                    title: 'Reset failed',
                    description: err?.response?.data?.message || 'Could not reset all reservations',
                    variant: 'destructive',
                  })
                }
              }}
            >
              Reset All Reservations
            </Button>
            <Button variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 w-full sm:w-auto" onClick={handleHardDeleteAll}>
              Purge Deleted
            </Button>
          </div>
        </div>

        {(() => {
          const activeFilters = [
            { label: 'Search', value: filters.search },
            { label: 'Category', value: options.categories.find(c => c._id === filters.category)?.name || filters.category },
            { label: 'Brand', value: options.brands.find(b => b._id === filters.brand)?.name || filters.brand },
            { label: 'Color', value: options.colors.find(c => c._id === filters.color)?.name || filters.color },
            { label: 'Type', value: filters.clothingType },
            { label: 'Sale', value: filters.onSale ? 'On Sale' : '' }
          ].filter(item => item.value)

          if (activeFilters.length === 0) return null

          return (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Active Filters</span>
              {activeFilters.map(item => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500"
                >
                  {item.label}: {item.value}
                </span>
              ))}
              <button
                type="button"
                onClick={resetFilters}
                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black border border-gray-200 rounded-full px-3 py-1"
              >
                Clear All
              </button>
            </div>
          )
        })()}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search product title..."
            className="h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
          />

          <Select
            className="text-sm w-full"
            placeholder="Category"
            isClearable
            options={options.categories.map(c => ({ value: c._id, label: c.name }))}
            value={filters.category ? { value: filters.category, label: options.categories.find(c => c._id === filters.category)?.name || '' } : null}
            onChange={opt => handleFilterChange('category', opt?.value)}
          />

          {options.categories.find(c => c._id === filters.category)?.name.toLowerCase() === 'clothing' && (
            <Select
              className="text-sm w-full"
              placeholder="Type"
              isClearable
              options={[
                { value: 'clothes', label: 'Clothes' },
                { value: 'shoes', label: 'Shoes' },
                { value: 'bags', label: 'Bags' },
                { value: 'eyeglass', label: 'Eyeglass' },
              ]}
              value={filters.clothingType ? { value: filters.clothingType, label: filters.clothingType } : null}
              onChange={opt => handleFilterChange('clothingType', opt?.value)}
            />
          )}

          <Select
            className="text-sm w-full"
            placeholder="Brand"
            isClearable
            options={options.brands.map(b => ({ value: b._id, label: b.name }))}
            value={filters.brand ? { value: filters.brand, label: options.brands.find(b => b._id === filters.brand)?.name || '' } : null}
            onChange={opt => handleFilterChange('brand', opt?.value)}
          />

          <Select
            className="text-sm w-full"
            placeholder="Color"
            isClearable
            options={options.colors.map(c => ({ value: c._id, label: c.name }))}
            value={filters.color ? { value: filters.color, label: options.colors.find(c => c._id === filters.color)?.name || '' } : null}
            onChange={opt => handleFilterChange('color', opt?.value)}
          />

          <button
            type="button"
            onClick={() => {
              setFilters(prev => ({ ...prev, onSale: !prev.onSale }))
              setPage(1)
            }}
            className={`h-10 rounded-md border px-3 text-[10px] font-black uppercase tracking-widest transition-colors w-full sm:w-auto ${filters.onSale ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:text-black hover:border-black'}`}
          >
            {filters.onSale ? 'On Sale Only' : 'Show On Sale'}
          </button>

          <Button variant="ghost" className="text-gray-500 hover:text-black w-full sm:w-auto" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      </div>

      {/* PRODUCT TABLE */}
      <div ref={listTopRef} />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Mobile cards */}
        <div className="lg:hidden p-4 space-y-4">
          {products.map((p) => {
            const hasDiscount = Number(p.discount || 0) > 0 || (p.variants || []).some(v => Number(v?.discount || 0) > 0)
            const skuCounts = (p.variants || []).reduce((acc, v) => {
              const sku = String(v?.sku || '').trim()
              if (!sku) return acc
              acc[sku] = (acc[sku] || 0) + 1
              return acc
            }, {})
            const duplicateSkus = Object.keys(skuCounts).filter(k => skuCounts[k] > 1)
            const variantStock = (p.variants || []).reduce((sum, v) => sum + Number(v?.stock || 0), 0)
            const variantReserved = (p.variants || []).reduce((sum, v) => sum + Number(v?.reserved || 0), 0)
            const totalStock = Number(p.stock || 0) + variantStock
            const totalReserved = Number(p.reserved || 0) + variantReserved
            const availableStock = Math.max(0, totalStock - totalReserved)
            const isLowStock = totalStock > 0 && availableStock <= LOW_STOCK_THRESHOLD
            const showReserveInfo = totalStock > 0 || totalReserved > 0
            return (
              <div key={p._id} className={`rounded-2xl border border-gray-100 p-4 shadow-sm ${p.isDeleted ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
                    <img src={p.images?.[0]?.url || '/placeholder.png'} alt={p.title} className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 line-clamp-1">{p.title}</p>
                    <p className="text-[10px] text-gray-400 font-mono tracking-tighter">#{p._id.slice(-8)}</p>
                    <p className="text-xs text-gray-500 mt-1">{p.category?.name || '-'}</p>
                  </div>
                  <div className="text-right text-sm font-bold text-gray-900">₦{(p.price || 0).toLocaleString()}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.featured && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-tighter w-fit">
                      Featured
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase tracking-tighter w-fit">
                      Discount
                    </span>
                  )}
                  {p.isDeleted ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800 uppercase tracking-tighter w-fit text-red-600">
                      Deleted
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 uppercase tracking-tighter w-fit">
                      Active
                    </span>
                  )}
                  {duplicateSkus.length > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-tighter w-fit">
                      Duplicate SKU
                    </span>
                  )}
                  {isLowStock && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-tighter w-fit">
                      Low Stock
                    </span>
                  )}
                </div>
                {showReserveInfo && (
                  <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Avail {availableStock} - Reserved {totalReserved}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleToggleFeatured(p)}
                    className={`p-2 rounded-lg border transition-colors ${p.featured ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-gray-200 text-gray-400 hover:text-black'}`}
                    title={p.featured ? "Unfeature" : "Feature"}
                  >
                    <Star size={16} fill={p.featured ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => openRestockModal(p)}
                    className="p-2 rounded-lg border border-emerald-100 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                    title="Quick Restock"
                  >
                    <PackagePlus size={16} />
                  </button>
                  {!p.isDeleted ? (
                    <>
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
                        title="Edit Product"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleResetReservation(p)}
                        className="p-2 rounded-lg border border-blue-100 text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        title="Reset Reservations"
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button
                        onClick={() => handleSoftDelete(p._id)}
                        className="p-2 rounded-lg border border-red-100 text-red-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRestore(p._id)}
                        className="p-2 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                        title="Restore Product"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        onClick={() => handleHardDelete(p._id)}
                        className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        title="Permanently Delete"
                      >
                        <Trash size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto max-h-[70vh] relative">
          <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {products.length} item{products.length !== 1 ? 's' : ''} shown
            </div>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-12 z-10 bg-gray-50">
              <tr className="border-b border-gray-100 text-xs text-gray-500 font-bold uppercase tracking-widest">
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Info</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => {
                const hasDiscount = Number(p.discount || 0) > 0 || (p.variants || []).some(v => Number(v?.discount || 0) > 0)
                const skuCounts = (p.variants || []).reduce((acc, v) => {
                  const sku = String(v?.sku || '').trim()
                  if (!sku) return acc
                  acc[sku] = (acc[sku] || 0) + 1
                  return acc
                }, {})
                const duplicateSkus = Object.keys(skuCounts).filter(k => skuCounts[k] > 1)
                const variantStock = (p.variants || []).reduce((sum, v) => sum + Number(v?.stock || 0), 0)
                const variantReserved = (p.variants || []).reduce((sum, v) => sum + Number(v?.reserved || 0), 0)
                const totalStock = Number(p.stock || 0) + variantStock
                const totalReserved = Number(p.reserved || 0) + variantReserved
                const availableStock = Math.max(0, totalStock - totalReserved)
                const isLowStock = totalStock > 0 && availableStock <= LOW_STOCK_THRESHOLD
                const showReserveInfo = totalStock > 0 || totalReserved > 0
                return (
                <tr key={p._id} className={`hover:bg-gray-50/50 transition-colors ${p.isDeleted ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden">
                        <img
                          src={p.images?.[0]?.url || '/placeholder.png'}
                          alt={p.title}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div className="max-w-[200px]">
                        <p className="font-semibold text-gray-900 line-clamp-1">{p.title}</p>
                        <p className="text-xs text-gray-400 font-mono tracking-tighter">#{p._id.slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      <p><span className="text-gray-400">Cat:</span> {p.category?.name || '-'}</p>
                      <p><span className="text-gray-400">Brand:</span> {p.brand?.name || '-'}</p>
                      {showReserveInfo && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Avail {availableStock} - Res {totalReserved}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900 italic">NGN {(p.price || 0).toLocaleString()}</div>
                    {p.variants?.length > 0 && (
                      <div className="text-[10px] text-gray-400 mt-0.5">{p.variants.length} Variants</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      {p.featured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-tighter w-fit">
                          Featured
                        </span>
                      )}
                      {hasDiscount && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase tracking-tighter w-fit">
                          Discount
                        </span>
                      )}
                      {p.isDeleted ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800 uppercase tracking-tighter w-fit text-red-600">
                          Deleted
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 uppercase tracking-tighter w-fit">
                          Active
                        </span>
                      )}
                      {duplicateSkus.length > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-tighter w-fit">
                          Duplicate SKU
                        </span>
                      )}
                      {isLowStock && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-tighter w-fit">
                          Low Stock
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleToggleFeatured(p)}
                        className={`p-2 rounded-lg border transition-colors ${p.featured ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-gray-200 text-gray-400 hover:text-black'}`}
                        title={p.featured ? "Unfeature" : "Feature"}
                      >
                        <Star size={16} fill={p.featured ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={() => openRestockModal(p)}
                        className="p-2 rounded-lg border border-emerald-100 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                        title="Quick Restock"
                      >
                        <PackagePlus size={16} />
                      </button>

                      {!p.isDeleted ? (
                        <>
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
                            title="Edit Product"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleResetReservation(p)}
                            className="p-2 rounded-lg border border-blue-100 text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            title="Reset Reservations"
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button
                            onClick={() => handleSoftDelete(p._id)}
                            className="p-2 rounded-lg border border-red-100 text-red-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRestore(p._id)}
                            className="p-2 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                            title="Restore Product"
                          >
                            <RotateCcw size={16} />
                          </button>
                          <button
                            onClick={() => handleHardDelete(p._id)}
                            className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                            title="Permanently Delete"
                          >
                            <Trash size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <p className="text-sm font-semibold">No products matched your filters.</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button variant="outline" className="rounded-xl" onClick={resetFilters}>Clear Filters</Button>
              <Button className="bg-black hover:bg-gray-800 rounded-xl" onClick={() => setEditingProduct({})}>Create Product</Button>
            </div>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          <Button
            disabled={page === 1}
            onClick={() => {
              setPage(p => p - 1)
              scrollToListTop()
            }}
          >
            Prev
          </Button>
          <span>Page {page} of {totalPages}</span>
          <Button
            disabled={page === totalPages}
            onClick={() => {
              setPage(p => p + 1)
              scrollToListTop()
            }}
          >
            Next
          </Button>
        </div>
      )}

      {/* MODAL */}
      {editingProduct && (
        <Modal title={editingProduct._id ? 'Edit Product' : 'Create Product'} onClose={() => setEditingProduct(null)}>
          <ProductForm
            product={editingProduct._id ? editingProduct : null}
            onClose={() => setEditingProduct(null)}
            onSuccess={() => refetch()}
            closeOnSuccess
          />
        </Modal>
      )}

      {restockProduct && (
        <Modal
          title={`Quick Restock · ${restockProduct.title}`}
          onClose={closeRestockModal}
        >
          <div className="p-4 space-y-4">
            {restockProduct.variants?.length ? (
              <div className="space-y-3">
                <div className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Update base + variant stock, price, and discount
                </div>
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 rounded-xl border border-gray-100 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      Base Product (Stock + Price + Discount)
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Applies to the main product alongside variants
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
                    <input
                      type="number"
                      min="0"
                      value={restockBaseStock}
                      onChange={(e) => setRestockBaseStock(e.target.value)}
                      className="h-10 w-full sm:w-32 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                      placeholder="Stock"
                    />
                    <input
                      type="number"
                      min="0"
                      value={restockBasePrice}
                      onChange={(e) => setRestockBasePrice(e.target.value)}
                      className="h-10 w-full sm:w-32 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                      placeholder="Price"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={restockBaseDiscount}
                      onChange={(e) => setRestockBaseDiscount(e.target.value)}
                      className="h-10 w-full sm:w-32 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                      placeholder="Discount %"
                    />
                  </div>
                </div>
                {restockVariants.map((variant, idx) => (
                  <div
                    key={variant._id || `${variant.sku}-${idx}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-gray-100 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {variant.sku || 'Variant'}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {formatVariantColor(variant.options?.color, variant.colorLabel)}
                        {variant.options?.size ? ` • Size: ${variant.options.size}` : ' • Size: -'}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto">
                      <input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(e) => {
                          const next = Number(e.target.value)
                          setRestockVariants(prev => {
                            const copy = [...prev]
                            copy[idx] = { ...copy[idx], stock: Number.isFinite(next) ? next : 0 }
                            return copy
                          })
                        }}
                        className="h-10 w-full sm:w-32 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                        placeholder="Stock"
                      />
                      <input
                        type="number"
                        min="0"
                        value={variant.price}
                        onChange={(e) => {
                          const next = Number(e.target.value)
                          setRestockVariants(prev => {
                            const copy = [...prev]
                            copy[idx] = { ...copy[idx], price: Number.isFinite(next) ? next : 0 }
                            return copy
                          })
                        }}
                        className="h-10 w-full sm:w-32 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                        placeholder="Price"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={variant.discount}
                        onChange={(e) => {
                          const next = Number(e.target.value)
                          setRestockVariants(prev => {
                            const copy = [...prev]
                            copy[idx] = { ...copy[idx], discount: Number.isFinite(next) ? next : 0 }
                            return copy
                          })
                        }}
                        className="h-10 w-full sm:w-32 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                        placeholder="Discount %"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Update base stock, price, and discount
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="0"
                    value={restockStock}
                    onChange={(e) => setRestockStock(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                    placeholder="Stock"
                  />
                  <input
                    type="number"
                    min="0"
                    value={restockBasePrice}
                    onChange={(e) => setRestockBasePrice(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                    placeholder="Price"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={restockBaseDiscount}
                    onChange={(e) => setRestockBaseDiscount(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                    placeholder="Discount %"
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={closeRestockModal}
                disabled={isUpdatingProduct || isUpdatingVariants}
              >
                Cancel
              </Button>
              <Button
                className="rounded-xl bg-black hover:bg-gray-800"
                onClick={handleRestockSave}
                disabled={isUpdatingProduct || isUpdatingVariants}
              >
                {isUpdatingProduct || isUpdatingVariants ? 'Saving...' : 'Save Stock'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}


