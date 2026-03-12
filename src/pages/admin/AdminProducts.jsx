import React, { useEffect, useRef, useState } from 'react'
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
} from '@/features/products/productApi'
import ProductForm from './ProductForm'
import Modal from './Modal'
import { Star, Edit, Trash2, RotateCcw, Trash } from 'lucide-react'

export default function AdminProducts() {
  const [toggleFeatured] = useToggleFeaturedMutation()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [editingProduct, setEditingProduct] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    brand: '',
    color: '',
    clothingType: '',
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
        },
      })
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
        categories: res.data.categories || [],
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
    setFilters({ search: '', category: '', brand: '', color: '', clothingType: '' })
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900">Filters & Inventory</h2>
          <div className="flex gap-2">
            <Button onClick={() => setEditingProduct({})} className="bg-black hover:bg-gray-800 rounded-xl">
              + Create Product
            </Button>
            <Button variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50" onClick={handleHardDeleteAll}>
              Purge Deleted
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search product title..."
            className="h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
          />

          <Select
            className="text-sm"
            placeholder="Category"
            isClearable
            options={options.categories.map(c => ({ value: c._id, label: c.name }))}
            value={filters.category ? { value: filters.category, label: options.categories.find(c => c._id === filters.category)?.name || '' } : null}
            onChange={opt => handleFilterChange('category', opt?.value)}
          />

          {options.categories.find(c => c._id === filters.category)?.name.toLowerCase() === 'clothing' && (
            <Select
              className="text-sm"
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
            className="text-sm"
            placeholder="Brand"
            isClearable
            options={options.brands.map(b => ({ value: b._id, label: b.name }))}
            value={filters.brand ? { value: filters.brand, label: options.brands.find(b => b._id === filters.brand)?.name || '' } : null}
            onChange={opt => handleFilterChange('brand', opt?.value)}
          />

          <Select
            className="text-sm"
            placeholder="Color"
            isClearable
            options={options.colors.map(c => ({ value: c._id, label: c.name }))}
            value={filters.color ? { value: filters.color, label: options.colors.find(c => c._id === filters.color)?.name || '' } : null}
            onChange={opt => handleFilterChange('color', opt?.value)}
          />

          <Button variant="ghost" className="text-gray-500 hover:text-black" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      </div>

      {/* PRODUCT TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 italic text-xs text-gray-500">
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Info</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
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
                      <p><span className="text-gray-400">Cat:</span> {p.category?.name || '—'}</p>
                      <p><span className="text-gray-400">Brand:</span> {p.brand?.name || '—'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900 italic">₦{(p.price || 0).toLocaleString()}</div>
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
                      {p.isDeleted ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800 uppercase tracking-tighter w-fit text-red-600">
                          Deleted
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 uppercase tracking-tighter w-fit">
                          Active
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
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="p-12 text-center text-gray-500 italic">No products matched your filters.</div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          <Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <span>Page {page} of {totalPages}</span>
          <Button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
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
    </div>
  )
}
