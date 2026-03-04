// components/ProductForm.js
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import axios from '@/lib/axios'
import {
  useCreateProductMutation,
  useUpdateProductMutation
} from '@/features/products/productApi'

export default function ProductForm({ product, onClose, onSuccess }) {
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
  const [imagePreviews, setImagePreviews] = useState([]) // EXISTING + NEW
  const [clothingType, setClothingType] = useState('')

  // ---------------- VARIANTS STATE ----------------
  const [variants, setVariants] = useState([])

  // ---------------- FILTER OPTIONS ----------------
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [colors, setColors] = useState([])
  const [sizes, setSizes] = useState([])
  const clothingTypes = ['clothes', 'shoes', 'bag', 'eyeglass']

  // ---------------- ERRORS ----------------
  const [errors, setErrors] = useState({})

  // ---------------- RTK QUERY MUTATIONS ----------------
  const [createProduct] = useCreateProductMutation()
  const [updateProduct] = useUpdateProductMutation()

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
    if (type === 'shoes') return ['6', '7', '8', '9', '10', '11']
    if (type === 'clothes') return ['XS', 'S', 'M', 'L', 'XL']
    if (type === 'bag' || type === 'eyeglass') return ['Standard']
    return []
  }

  /* =====================================================
     INITIALIZE PRODUCT (EDIT MODE)
  ===================================================== */
  useEffect(() => {
    if (!product) return

    setTitle(product.title || '')
    setDescription(product.description || '')
    setPrice(product.price || 0)
    setStock(product.stock || 0)
    setCategory(product.category?._id || '')
    setBrand(product.brand?._id || '')
    setColor(product.color?._id || product.color || '')
    setTags(product.tags?.join(', ') || '')
    setClothingType(product.clothingType || '')

    // MAIN IMAGES (EXISTING)
    const existingImages = product.images || []
    setImagePreviews(existingImages.map(i => i.url))

    // VARIANTS
   const normalizedVariants =
  product.variants?.map(v => ({
    _id: v._id, // ✅ ADD THIS LINE
    sku: v.sku || generateSKU(),
    type: v.type || 'clothes',
    options: {
      color: v.options?.color?._id || v.options?.color || '',
      size: v.options?.size || ''
    },
    price: v.price || 0,
    stock: v.stock || 0,
    image: v.image,
    imageFile: null,
    imageUrl: v.image?.url || ''
  })) || []

    setVariants(normalizedVariants)
  }, [product])

  /* =====================================================
     FETCH FILTER OPTIONS
  ===================================================== */
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/products/filters`)
      .then(res => {
        setCategories(res.data.categories || [])
        setColors(res.data.colors || [])
        setSizes(res.data.sizes || [])
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
        const stillValid = res.data.brands?.some(b => b._id === brand)
        if (!stillValid) setBrand('')
        const isClothingCategory = categories.find(c => c._id === category)?.name.toLowerCase() === 'clothing'
        if (!isClothingCategory) setClothingType('')
      })
      .catch(console.error)
  }, [category])

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
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        variants: payloadVariants,
      }

      fd.append('payload', JSON.stringify(payload))

      if (product?._id) {
        await updateProduct({ id: product._id, formData: fd }).unwrap()
      } else {
        await createProduct(fd).unwrap()
      }

      toast({ title: 'Product saved successfully' })
      onSuccess?.()
      onClose()
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-2">
      {/* ====== TITLE, DESCRIPTION, PRICE, STOCK ====== */}
      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
      {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}

      <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />

      <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" />
      {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}

      <Input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="Stock" />

      {/* ====== CATEGORY ====== */}
      <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border rounded">
        <option value="">Select category</option>
        {categories.map(c => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>
      {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}

      {/* ====== BRAND ====== */}
      {brands.length > 0 && (
        <select value={brand} onChange={e => setBrand(e.target.value)} className="w-full border rounded">
          <option value="">Select brand</option>
          {brands.map(b => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>
      )}

      {/* ====== CLOTHING TYPE ====== */}
      {isClothing && (
        <select value={clothingType} onChange={e => setClothingType(e.target.value)} className="w-full border rounded">
          <option value="">Select clothing type</option>
          {clothingTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )}

      {/* ====== COLOR ====== */}
      {colors.length > 0 && (
        <select value={color} onChange={e => setColor(e.target.value)} className="w-full border rounded">
          <option value="">Select color</option>
          {colors.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      )}

      {/* ====== VARIANTS ====== */}
      <div>
        <p className="font-semibold">Variants</p>
        {variants.map((v, idx) => (
          <div key={idx} className="border p-2 space-y-2">
            <Input value={v.sku} readOnly />
            {errors[`sku_${idx}`] && <p className="text-red-500 text-sm">{errors[`sku_${idx}`]}</p>}

            {isClothing && (
              <select value={v.type} onChange={e => updateVariant(idx, 'type', e.target.value)} className="w-full border rounded">
                <option value="">Select type</option>
                {clothingTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}

            <select value={v.options.color} onChange={e => updateVariant(idx, 'color', e.target.value)} className="w-full border rounded">
              <option value="">Select color</option>
              {colors.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>

            <select value={v.options.size} onChange={e => updateVariant(idx, 'size', e.target.value)} className="w-full border rounded">
              <option value="">Select size</option>
              {getSizesForType(v.type || clothingType).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <Input type="number" value={v.price} onChange={e => updateVariant(idx, 'price', e.target.value)} placeholder="Price" />
            {errors[`price_${idx}`] && <p className="text-red-500 text-sm">{errors[`price_${idx}`]}</p>}

            <Input type="number" value={v.stock} onChange={e => updateVariant(idx, 'stock', e.target.value)} placeholder="Stock" />

            <input type="file" onChange={e => handleVariantFile(idx, e.target.files[0])} />
            {v.imageUrl && <img src={v.imageUrl} className="h-16" />}

            <Button type="button" variant="destructive" onClick={() => removeVariant(idx)}>Remove</Button>
          </div>
        ))}

        <Button type="button" onClick={addVariant}>+ Add Variant</Button>
      </div>

      {/* ====== MAIN IMAGES ====== */}
      <div>
        <p className="font-semibold">Main Images</p>
        <input type="file" multiple accept="image/*" onChange={handleMainImages} />
        <div className="flex gap-2 flex-wrap mt-2">
          {imagePreviews.map((src, idx) => (
            <img key={idx} src={src} className="h-20 rounded border" />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  )
}
