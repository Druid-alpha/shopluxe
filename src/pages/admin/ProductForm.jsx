// components/ProductForm.js
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Trash2 } from 'lucide-react'
import axios from '@/lib/axios'
import {
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation
} from '@/features/products/productApi'

export default function ProductForm({ product, onClose, onSuccess, closeOnSuccess = true }) {
  const { toast } = useToast()

  // ---------------- MAIN PRODUCT STATE ----------------
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(0)
  const [stock, setStock] = useState(0)
  const [color, setColor] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [tags, setTags] = useState('')
  const [images, setImages] = useState([]) // NEW UPLOADS
  const [existingImages, setExistingImages] = useState([]) // IMAGES FROM SERVER
  const [imagePreviews, setImagePreviews] = useState([]) // NEW UPLOADS PREVIEWS
  const [clothingType, setClothingType] = useState('')
  const [discount, setDiscount] = useState(0)

  // ---------------- VARIANTS STATE ----------------
  const [variants, setVariants] = useState([])

  // ---------------- FILTER OPTIONS ----------------
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [colors, setColors] = useState([])
  const [sizeOptionsByClothingType, setSizeOptionsByClothingType] = useState({
    clothes: [],
    shoes: [],
    bags: [],
    eyeglass: []
  })
  const clothingTypes = ['clothes', 'shoes', 'bags', 'eyeglass']

  // ---------------- ERRORS ----------------
  const [errors, setErrors] = useState({})

  // ---------------- RTK QUERY MUTATIONS ----------------
  const [createProduct] = useCreateProductMutation()
  const [updateProduct] = useUpdateProductMutation()
  const { data: fullProductData, isFetching: isFetchingProduct } = useGetProductQuery(product?._id, {
    skip: !product?._id
  })
  const editableProduct = fullProductData?.product || product

  /* =====================================================
     HELPERS
  ===================================================== */
  const normalize = str =>
    str?.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'GEN'

  const generateSKU = () => {
    const catName = categories.find(c => c._id === category)?.name
    const brandName = brands.find(b => b._id === brand)?.name
    return `${normalize(catName)}-${normalize(brandName)}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
  }

  const getSizesForType = type => {
    const t = String(type || '').toLowerCase()
    const normalizedType = t === 'bag' ? 'bags' : t
    return sizeOptionsByClothingType[normalizedType] || []
  }

  /* =====================================================
     INITIALIZE PRODUCT (EDIT MODE)
  ===================================================== */
  useEffect(() => {
    if (!editableProduct) return

    setTitle(editableProduct.title || '')
    setDescription(editableProduct.description || '')
    setPrice(editableProduct.price || 0)
    setStock(editableProduct.stock || 0)
    setCategory(editableProduct.category?._id || '')
    setBrand(editableProduct.brand?._id || '')
    setColor(editableProduct.color?._id || editableProduct.color || '')
    setTags(editableProduct.tags?.join(', ') || '')
    const normalizedClothingType =
      editableProduct.clothingType === 'bag'
        ? 'bags'
        : (editableProduct.clothingType || '')
    setClothingType(normalizedClothingType)
    setDiscount(editableProduct.discount || 0)

    // MAIN IMAGES (EXISTING)
    setExistingImages(editableProduct.images || [])
    setImagePreviews([]) // Clear new uploads previews
    setImages([])

    // VARIANTS
    const normalizedVariants =
      editableProduct.variants?.map(v => ({
        _id: v._id, // ✅ ADD THIS LINE
        sku: v.sku || generateSKU(),
        type: (v.type === 'bag' ? 'bags' : (v.type || normalizedClothingType || '')),
        options: {
          color: v.options?.color?._id || v.options?.color || '',
          size: v.options?.size || ''
        },
        price: v.price || 0,
        discount: v.discount || 0,
        stock: v.stock || 0,
        image: v.image,
        imageFile: null,
        imageUrl: v.image?.url || ''
      })) || []

    setVariants(normalizedVariants)
  }, [editableProduct?._id, fullProductData])

  /* =====================================================
     FETCH FILTER OPTIONS
  ===================================================== */
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/products/filters`)
      .then(res => {
        setCategories(res.data.categories || [])
        setColors(res.data.colors || [])
        setSizeOptionsByClothingType(
          res.data.sizeOptionsByClothingType || {
            clothes: [],
            shoes: [],
            bags: [],
            eyeglass: []
          }
        )
      })
      .catch(console.error)
  }, [])

  /* =====================================================
     FETCH BRANDS (DO NOT WIPE EXISTING BRAND)
  ===================================================== */
  useEffect(() => {
    if (!category) {
      setBrands([])
      setClothingType('')
      setBrand('')
      return
    }

    axios
      .get(`${import.meta.env.VITE_API_URL}/products/filters?category=${category}`)
      .then(res => {
        setBrands(res.data.brands || [])
        setSizeOptionsByClothingType(
          res.data.sizeOptionsByClothingType || {
            clothes: [],
            shoes: [],
            bags: [],
            eyeglass: []
          }
        )
        const stillValid = res.data.brands?.some(b => b._id === brand)
        if (!stillValid) setBrand('')
        const selectedCategory = categories.find(c => c._id === category)
        if (selectedCategory && selectedCategory.name?.toLowerCase() !== 'clothing') {
          setClothingType('')
        }
      })
      .catch(console.error)
  }, [category, categories, brand])

  /* =====================================================
     VARIANT HANDLERS
  ===================================================== */
  const addVariant = () => {
    setVariants(prev => [
      ...prev,
      {
        sku: generateSKU(),
        type: clothingType || '',
        options: { color: '', size: '' },
        price: 0,
        discount: 0,
        stock: 0,
        image: null,
        imageFile: null,
        imageUrl: ''
      }
    ])
  }

  const updateVariant = (index, field, value) => {
    setVariants(prev => {
      const copy = [...prev]
      if (field === 'color' || field === 'size') {
        copy[index].options[field] = value
      } else {
        copy[index][field] = value
      }
      return copy
    })
  }

  const removeVariant = index => setVariants(prev => prev.filter((_, idx) => idx !== index))

  const handleClothingTypeChange = value => {
    const normalized = value === 'bag' ? 'bags' : value
    setClothingType(normalized)
    setVariants(prev =>
      prev.map(v => ({
        ...v,
        type: normalized,
        options: {
          ...v.options,
          size: getSizesForType(normalized).includes(v.options.size) ? v.options.size : ''
        }
      }))
    )
  }

  const handleVariantFile = (index, file) => {
    setVariants(prev => {
      const copy = [...prev]
      copy[index].imageFile = file
      copy[index].imageUrl = URL.createObjectURL(file)
      return copy
    })
  }

  /* =====================================================
     MAIN IMAGE HANDLERS
  ===================================================== */
  const handleMainImages = e => {
    const files = Array.from(e.target.files)
    setImages(prev => [...prev, ...files])
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  const removeExistingImage = (public_id) => {
    setExistingImages(prev => prev.filter(img => img.public_id !== public_id))
  }

  const removeNewImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  /* =====================================================
     AUTO-SYNC VARIANT SIZE WITH CLOTHING TYPE
  ===================================================== */
  useEffect(() => {
    if (!clothingType) return
    setVariants(prev =>
      prev.map(v => ({
        ...v,
        options: {
          ...v.options,
          size: getSizesForType(clothingType).includes(v.options.size)
            ? v.options.size
            : ''
        }
      }))
    )
  }, [clothingType])

  /* =====================================================
     SKU UNIQUENESS VALIDATION
  ===================================================== */
  const isSkuUnique = sku =>
    variants.filter(v => v.sku === sku).length === 1

  /* =====================================================
     CLIENT VALIDATION
  ===================================================== */
  const validate = () => {
    const errs = {}
    if (!title) errs.title = 'Title is required'
    if (!category) errs.category = 'Category required'
    if (!price) errs.price = 'Price required'

    variants.forEach((v, i) => {
      if (!isSkuUnique(v.sku)) errs[`sku_${i}`] = 'SKU must be unique'
      if (!v.price) errs[`price_${i}`] = 'Variant price required'
    })

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  /* =====================================================
     SUBMIT USING RTK QUERY
  ===================================================== */
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    try {
      const fd = new FormData()

      images.forEach(f => fd.append('images', f))
      variants.forEach((v, idx) => {
        if (v.imageFile) fd.append(`variant_${idx}`, v.imageFile)
      })

      const payloadVariants = variants.map(v => ({
        _id: v._id, // ✅ ADD THIS LINE
        sku: v.sku,
        type: v.type,
        options: {
          color: v.options.color || undefined,
          size: v.options.size || undefined,
        },
        price: Number(v.price),
        discount: Number(v.discount || 0),
        stock: Number(v.stock),
        image: v.imageFile ? null : v.image
      }))

      const payload = {
        title,
        description,
        price: Number(price),
        stock: Number(stock),
        category,
        brand: brand || undefined,
        color: color || undefined,
        clothingType: clothingType || undefined,
        discount: Number(discount),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        variants: payloadVariants,
        images: existingImages // Pass existing images to keep
      }

      fd.append('payload', JSON.stringify(payload))

      if (product?._id) {
        await updateProduct({ id: product._id, formData: fd }).unwrap()
      } else {
        await createProduct(fd).unwrap()
      }

      toast({ title: 'Product saved successfully' })
      onSuccess?.()
      if (closeOnSuccess) onClose?.()
    } catch (err) {
      console.error('PRODUCT FORM ERROR:', err)
      toast({
        title: 'Error',
        description: err?.data?.message || err.message || 'Failed to save product',
        variant: 'destructive',
      })
    }
  }

  /* =====================================================
     UI
  ===================================================== */
  const isClothing = categories.find(c => c._id === category)?.name.toLowerCase() === 'clothing'

  if (product?._id && isFetchingProduct && !fullProductData?.product) {
    return <div className="py-10 text-center text-sm text-gray-500">Loading product details...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-4 py-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Product Name" className="rounded-xl border-gray-100 placeholder:text-gray-300" />
            {errors.title && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-tight">{errors.title}</p>}
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Description</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell a story about this product..."
              className="rounded-xl border-gray-100 min-h-[120px] placeholder:text-gray-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Price (₦)</label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" className="rounded-xl border-gray-100" />
              {errors.price && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-tight">{errors.price}</p>}
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Discount (%)</label>
              <Input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" className="rounded-xl border-gray-100" />
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Base Stock</label>
            <Input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" className="rounded-xl border-gray-100" />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Tags (comma separated)</label>
            <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="luxury, limited, winter" className="rounded-xl border-gray-100" />
          </div>
        </div>

        {/* Right Column: Facets & Images */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-10 px-3 py-2 text-sm border-gray-100 rounded-xl focus:outline-none focus:ring-0 focus:border-black transition-colors appearance-none">
                <option value="">Select category</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-tight">{errors.category}</p>}
            </div>

            {brands.length > 0 && (
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Brand</label>
                <select value={brand} onChange={e => setBrand(e.target.value)} className="w-full h-10 px-3 py-2 text-sm border-gray-100 rounded-xl focus:outline-none focus:ring-0 focus:border-black transition-colors appearance-none">
                  <option value="">Select brand</option>
                  {brands.map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isClothing && (
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Clothing Type</label>
                <select value={clothingType} onChange={e => handleClothingTypeChange(e.target.value)} className="w-full h-10 px-3 py-2 text-sm border-gray-100 rounded-xl focus:outline-none focus:ring-0 focus:border-black transition-colors appearance-none uppercase">
                  <option value="">Select type</option>
                  {clothingTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}

            {colors.length > 0 && (
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Primary Color</label>
                <select value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 px-3 py-2 text-sm border-gray-100 rounded-xl focus:outline-none focus:ring-0 focus:border-black transition-colors appearance-none">
                  <option value="">Select color</option>
                  {colors.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 block">Product Images</label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {existingImages.map((img) => (
                <div key={img.public_id} className="relative aspect-square rounded-lg border border-gray-50 flex-shrink-0 overflow-hidden bg-gray-50 group">
                  <img src={img.url} className="w-full h-full object-contain mix-blend-multiply" />
                  <button type="button" onClick={() => removeExistingImage(img.public_id)} className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold">REMOVE</button>
                </div>
              ))}
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg border border-blue-50 flex-shrink-0 overflow-hidden bg-blue-50 group">
                  <img src={src} className="w-full h-full object-contain mix-blend-multiply" />
                  <button type="button" onClick={() => removeNewImage(idx)} className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold">DISCARD</button>
                </div>
              ))}
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-gray-50 transition-all">
                <Input type="file" multiple accept="image/*" onChange={handleMainImages} className="hidden" />
                <span className="text-[20px] font-light text-gray-400">+</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ====== VARIANTS ====== */}
      <div className="border-t border-gray-50 pt-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black uppercase tracking-[.2em] text-gray-900">Product Variants</h3>
          <Button type="button" onClick={addVariant} variant="outline" className="rounded-xl text-[10px] uppercase font-black tracking-widest border-black hover:bg-black hover:text-white">+ Add Variant</Button>
        </div>

        {variants.length > 0 ? (
          <div className="space-y-4">
            {variants.map((v, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-6 gap-4 items-end relative group">
                <div className="md:col-span-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">SKU</label>
                  <Input value={v.sku} readOnly className="rounded-xl border-gray-100 bg-white font-mono text-[10px]" />
                  {errors[`sku_${idx}`] && <p className="text-red-500 text-[8px] mt-1 font-bold uppercase">{errors[`sku_${idx}`]}</p>}
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Color</label>
                  <select value={v.options.color} onChange={e => updateVariant(idx, 'color', e.target.value)} className="w-full h-10 px-3 py-2 text-[10px] border-white bg-white rounded-xl focus:outline-none focus:ring-0">
                    <option value="">Color</option>
                    {colors.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Size</label>
                  <select value={v.options.size} onChange={e => updateVariant(idx, 'size', e.target.value)} className="w-full h-10 px-3 py-2 text-[10px] border-white bg-white rounded-xl focus:outline-none focus:ring-0">
                    <option value="">Size</option>
                    {getSizesForType(clothingType).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Price (₦)</label>
                  <Input type="number" value={v.price} onChange={e => updateVariant(idx, 'price', e.target.value)} className="rounded-xl border-white bg-white text-[10px]" />
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Discount (%)</label>
                  <Input type="number" value={v.discount || 0} onChange={e => updateVariant(idx, 'discount', e.target.value)} className="rounded-xl border-white bg-white text-[10px]" />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Stock</label>
                    <Input type="number" value={v.stock} onChange={e => updateVariant(idx, 'stock', e.target.value)} className="rounded-xl border-white bg-white text-[10px]" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative flex-1 h-20 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-white cursor-pointer hover:border-black transition-colors">
                      {v.imageUrl ? (
                        <img src={v.imageUrl} className="w-full h-full object-contain p-1" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <span className="text-lg leading-none">+</span>
                          <span className="text-[9px] font-black uppercase tracking-widest">Upload Photo</span>
                        </div>
                      )}
                      {v.imageUrl && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/55 text-white text-[8px] font-black uppercase tracking-widest text-center py-1">
                          Change Photo
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleVariantFile(idx, e.target.files[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </label>

                    <button type="button" onClick={() => removeVariant(idx)} className="p-2 text-red-300 hover:text-red-600 transition-colors shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-gray-100 rounded-2xl py-8 text-center text-gray-300 text-xs italic">
            No variants added. Base pricing and stock will be used.
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-8 border-t border-gray-50">
        <Button type="submit" className="bg-black text-white hover:bg-zinc-800 rounded-xl px-12 py-6 font-black uppercase tracking-widest text-[10px]">Publish Product</Button>
        <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl px-8 py-6 font-bold uppercase tracking-widest text-[10px] text-gray-400">Cancel</Button>
      </div>
    </form>
  )
}
