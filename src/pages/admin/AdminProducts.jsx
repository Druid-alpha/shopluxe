import React, { useEffect, useState } from 'react'
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

export default function AdminProducts() {
  const [toggleFeatured] = useToggleFeaturedMutation()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [editingProduct, setEditingProduct] = useState(null)
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    color: '',
    clothingType: '',
  })
  const [options, setOptions] = useState({
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
  })

  /* ================= ADMIN QUERY ================= */
  const { data, isLoading, refetch } = useGetAdminProductsQuery(
    {
      page,
      limit: 10,
      category: filters.category || undefined,
      brand: filters.brand || undefined,
      color: filters.color || undefined,
      clothingType: filters.clothingType || undefined,
    },
    { refetchOnMountOrArgChange: true }
  )
  const totalPages = data?.pages || 1

  /* ================= ADMIN MUTATIONS ================= */
  const [deleteProduct] = useDeleteProductMutation()
  const [restoreProduct] = useRestoreProductMutation()
  const [hardDeleteProduct] = useHardDeleteProductMutation()
  const [hardDeleteAllProducts] = useHardDeleteAllProductsMutation()

  /* ================= FILTER OPTIONS ================= */
  const loadFilters = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/products/filters`,
        {
          params: {
            category: filters.category,
            clothingType: filters.clothingType,
          },
        }
      )
      setOptions({
        categories: res.data.categories || [],
        brands: res.data.brands || [],
        colors: res.data.colors || [],
        sizes: res.data.sizes || [],
      })
    } catch (err) {
      toast({ title: 'Failed to load filters', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadFilters()
  }, [filters.category, filters.clothingType])

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value || '' }))
    setPage(1)
  }

  const resetFilters = () => {
    setFilters({ category: '', brand: '', color: '', clothingType: '' })
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

  if (isLoading) return <p>Loading products...</p>

  return (
    <div className="space-y-4">
      {/* FILTERS */}
      <div className="flex gap-2 flex-wrap">
        <Select
          className="min-w-[200px]"
          placeholder="Category"
          isClearable
          options={options.categories.map(c => ({ value: c._id, label: c.name }))}
          value={
            filters.category
              ? { value: filters.category, label: options.categories.find(c => c._id === filters.category)?.name || '' }
              : null
          }
          onChange={opt => handleFilterChange('category', opt?.value)}
        />

        <Select
          className="min-w-[200px]"
          placeholder="Clothing Type"
          isClearable
          options={[
            { value: 'clothes', label: 'Clothes' },
            { value: 'shoes', label: 'Shoes' },
            { value: 'bag', label: 'Bag' },
            { value: 'eyeglass', label: 'Eyeglass' },
          ]}
          value={filters.clothingType ? { value: filters.clothingType, label: filters.clothingType } : null}
          onChange={opt => handleFilterChange('clothingType', opt?.value)}
        />

        <Select
          className="min-w-[200px]"
          placeholder="Brand"
          isClearable
          options={options.brands.map(b => ({ value: b._id, label: b.name }))}
          value={filters.brand ? { value: filters.brand, label: options.brands.find(b => b._id === filters.brand)?.name || '' } : null}
          onChange={opt => handleFilterChange('brand', opt?.value)}
        />

        <Select
          className="min-w-[200px]"
          placeholder="Color"
          isClearable
          options={options.colors.map(c => ({ value: c._id, label: c.name }))}
          value={filters.color ? { value: filters.color, label: options.colors.find(c => c._id === filters.color)?.name || '' } : null}
          onChange={opt => handleFilterChange('color', opt?.value)}
        />

        <Button variant="destructive" onClick={resetFilters}>
          Reset
        </Button>
      </div>

      {/* CREATE */}
      <Button onClick={() => setEditingProduct({})}>+ Create Product</Button>

      {/* HARD DELETE ALL SOFT DELETED */}
      <Button variant="destructive" onClick={handleHardDeleteAll}>
        Hard Delete All Soft-Deleted
      </Button>

      {/* LIST */}
      {data?.products?.length ? (
        data.products.map(p => (
          <div key={p._id} className="border p-4 rounded flex gap-4">
            <img src={p.images?.[0]?.url || '/placeholder.png'} className="w-24 h-24 object-cover rounded border" />

            <div className="flex-1">
              <p className="font-semibold">{p.title}</p>

              {/* Base Price */}
              <p>Base Price: ₦{p.price}</p>

              {/* Variant Prices */}
              {p.variants?.length > 0 && (
                <div>
                  <p>Variant Prices:</p>
                  <ul className="ml-4 list-disc">
                    {p.variants.map((v, idx) => (
                      <li key={idx}>
                        {v.options?.size ? `Size ${v.options.size}` : ''}
                        {v.options?.color?.name ? `, Color ${v.options.color.name}` : ''}: ₦{v.price}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p>Category: {p.category?.name || '—'}</p>
              <p>Brand: {p.brand?.name || '—'}</p>
              {p.clothingType && <p>Type: {p.clothingType}</p>}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={p.featured ? "secondary" : "outline"}
                onClick={() => handleToggleFeatured(p)}
              >
                {p.featured ? "Unfeature" : "Feature"}
              </Button>
              {!p.isDeleted ? (
                <>
                  <Button size="sm" onClick={() => setEditingProduct(p)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleSoftDelete(p._id)}>Delete</Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="secondary" onClick={() => handleRestore(p._id)}>Restore</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleHardDelete(p._id)}>Hard Delete</Button>
                </>
              )}
            </div>
          </div>
        ))
      ) : (
        <p>No products found</p>
      )}

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
          <ProductForm product={editingProduct._id ? editingProduct : null} onClose={() => setEditingProduct(null)} onSuccess={() => setEditingProduct(null)} />
        </Modal>
      )}
    </div>
  )
}
