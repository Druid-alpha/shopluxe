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
  const BASE_SIZE_TAG_PREFIX = '__base_sizes:'
  const DEFAULT_SIZE_OPTIONS_BY_TYPE = {
    clothes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
    bags: ['Small', 'Medium', 'Large'],
    eyeglass: ['One Size']
  }

  // ---------------- MAIN PRODUCT STATE ----------------
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(0)
  const [stock, setStock] = useState(0)
  const [color, setColor] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [tags, setTags] = useState('')
  const [images, setImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [clothingType, setClothingType] = useState('')
  const [mainSizes, setMainSizes] = useState([])
  const [discount, setDiscount] = useState(0)

  // ---------------- VARIANTS STATE ----------------
  const [variants, setVariants] = useState([])

  // ---------------- FILTER OPTIONS ----------------
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [colors, setColors] = useState([])
  const [sizeOptionsByClothingType, setSizeOptionsByClothingType] = useState({ ...DEFAULT_SIZE_OPTIONS_BY_TYPE })
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

  // ---------------- INLINE CUSTOM COLOR CREATION ----------------
  // isColorPickerOpen can be: false, 'main', or a variant index (number)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [newColorName, setNewColorName] = useState('')
  const [newColorHex, setNewColorHex] = useState('#000000')
  const [creatingColor, setCreatingColor] = useState(false)

  const handleCreateCustomColor = async () => {
    if (!newColorName.trim() || !category) {
      toast({ title: 'Color Name & Category required', variant: 'destructive' })
      return null
    }

    setCreatingColor(true)
    try {
      // Direct axios call to the colors route we just made in adminRoutes
      const res = await axios.post('/admin/colors', {
        name: newColorName.trim(),
        hex: newColorHex,
        category: category
      })

      const newColor = res.data.color || res.data
      setColors(prev => [...prev, newColor])

      setIsColorPickerOpen(false)
      setNewColorName('')
      setNewColorHex('#000000')
      toast({ title: 'New color created successfully!' })
      return newColor._id

    } catch (err) {
      console.error(err)
      toast({
        title: 'Error formatting color',
        description: err.response?.data?.message || err.message,
        variant: 'destructive'
      })
      return null
    } finally {
      setCreatingColor(false)
    }
  }

  const copyToClipboard = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch (err) { }
    }
    // Fallback for iOS/non-secure contexts
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      textArea.style.top = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      return successful
    } catch (err) {
      return false
    }
  }

  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false)
  const [magnifier, setMagnifier] = useState({ show: false, x: 0, y: 0, hex: '#000000' })

  const handleEyeDropper = async () => {
    if (window.EyeDropper) {
      const eyeDropper = new window.EyeDropper()
      try {
        const result = await eyeDropper.open()
        setNewColorHex(result.sRGBHex)
        return
      } catch (e) {
        console.log('EyeDropper cancelled')
        return
      }
    }
    // Fallback for mobile/Safari
    setIsImagePickerOpen(true)
  }

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

  const parseBaseSizesFromTags = (rawTags = []) => {
    const marker = (rawTags || []).find(t => typeof t === 'string' && t.startsWith(BASE_SIZE_TAG_PREFIX))
    if (!marker) return []
    return marker.slice(BASE_SIZE_TAG_PREFIX.length).split('|').map(s => s.trim()).filter(Boolean)
  }

  const stripBaseSizeTag = (rawTags = []) =>
    (rawTags || []).filter(t => !(typeof t === 'string' && t.startsWith(BASE_SIZE_TAG_PREFIX)))

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
    const cleanedTags = stripBaseSizeTag(editableProduct.tags || [])
    setTags(cleanedTags.join(', ') || '')
    const normalizedClothingType =
      editableProduct.clothingType === 'bag' ? 'bags' : (editableProduct.clothingType || '')
    setClothingType(normalizedClothingType)
    const fallbackSizes = parseBaseSizesFromTags(editableProduct.tags || [])
    setMainSizes(Array.isArray(editableProduct.sizes) && editableProduct.sizes.length > 0 ? editableProduct.sizes : fallbackSizes)
    setDiscount(editableProduct.discount || 0)
    setExistingImages(editableProduct.images || [])
    setImagePreviews([])
    setImages([])

    const normalizedVariants =
      editableProduct.variants?.map(v => ({
        _id: v._id,
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
    axios.get('/products/filters')
      .then(res => {
        setCategories(res.data.categories || [])
        setColors(res.data.colors || [])
        setSizeOptionsByClothingType(res.data.sizeOptionsByClothingType || DEFAULT_SIZE_OPTIONS_BY_TYPE)
      })
      .catch(console.error)
  }, [])

  /* =====================================================
     FETCH BRANDS
  ===================================================== */
  useEffect(() => {
    if (!category) {
      setBrands([])
      setClothingType('')
      setBrand('')
      return
    }
    axios.get('/products/filters', { params: { category } })
      .then(res => {
        setBrands(res.data.brands || [])
        setSizeOptionsByClothingType(res.data.sizeOptionsByClothingType || DEFAULT_SIZE_OPTIONS_BY_TYPE)
        const stillValid = res.data.brands?.some(b => b._id === brand)
        if (!stillValid) setBrand('')
      })
      .catch(console.error)
  }, [category, brand])

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

    // ONLY filter mainSizes if we aren't in a category that uses custom specs (Electronics/Grocery)
    if (!isElectronics && !isGrocery) {
      setMainSizes(prev => prev.filter(s => getSizesForType(normalized).includes(s)))
    }

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

  const toggleMainSize = size => {
    setMainSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
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

    // ONLY filter sizes if we aren't in Electronics/Grocery
    if (!isElectronics && !isGrocery) {
      setMainSizes(prev => prev.filter(s => getSizesForType(clothingType).includes(s)))
    }

    setVariants(prev =>
      prev.map(v => ({
        ...v,
        options: {
          ...v.options,
          size: getSizesForType(clothingType).includes(v.options.size) ? v.options.size : ''
        }
      }))
    )
  }, [clothingType])

  /* =====================================================
     SKU UNIQUENESS VALIDATION
  ===================================================== */
  const isSkuUnique = sku => variants.filter(v => v.sku === sku).length === 1

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
     SUBMIT
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
        _id: v._id,
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

      const plainTags = tags.split(',').map(t => t.trim()).filter(Boolean)
      const payloadTags = [
        ...stripBaseSizeTag(plainTags),
        ...(mainSizes.length > 0 ? [`${BASE_SIZE_TAG_PREFIX}${mainSizes.join('|')}`] : [])
      ]

      const payload = {
        title,
        description,
        price: Number(price),
        stock: Number(stock),
        category,
        brand: brand || undefined,
        color: color || undefined,
        clothingType: clothingType || undefined,
        sizes: mainSizes,
        discount: Number(discount),
        tags: payloadTags,
        variants: payloadVariants,
        images: existingImages
      }

      fd.append('payload', JSON.stringify(payload))

      let saved
      if (product?._id) {
        saved = await updateProduct({ id: product._id, formData: fd }).unwrap()
      } else {
        saved = await createProduct(fd).unwrap()
      }

      toast({
        title: product?._id ? 'Product updated successfully' : 'Product created successfully',
      })
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
     UI HELPERS
  ===================================================== */
  // Show clothing type + size selectors for ANY category (shoes/bags/eyeglass/clothing all need them)
  const isClothingLike = !!category
  const availableMainSizes = getSizesForType(clothingType)

  const isElectronics =
    categories.find(c => c._id === category)?.name?.toLowerCase().includes('electronic') || false
  const isGrocery =
    categories.find(c => c._id === category)?.name?.toLowerCase().includes('groc') || false

  const CLOTHING_TYPE_LABELS = {
    clothes: 'Clothing Sizes (S, M, L…)',
    shoes: 'Shoe Sizes (36–46)',
    bags: 'Bag Sizes (S/M/L)',
    eyeglass: 'Frame Sizes'
  }

  if (product?._id && isFetchingProduct && !fullProductData?.product) {
    return <div className="py-10 text-center text-sm text-gray-500">Loading product details...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-4 py-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── LEFT COLUMN ── */}
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

          {/* MAIN PRODUCT SIZES / SPECS — admin picks which sizes or specs this product is available in */}
          {(isClothingLike || isElectronics || isGrocery) && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">
                  {categories.find(c => c._id === category)?.name?.toLowerCase().includes('electronics') ? 'Product Specifications' : 'Available Sizes'}
                </label>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder={categories.find(c => c._id === category)?.name?.toLowerCase().includes('electronics') ? "Add specification (e.g. 8GB RAM)" : "Add custom size (e.g. 500g)"}
                    className="rounded-xl border-gray-100"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.target.value.trim();
                        if (val && !mainSizes.includes(val)) {
                          setMainSizes(prev => [...prev, val]);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                </div>
                {availableMainSizes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {availableMainSizes.map(size => {
                      const checked = mainSizes.includes(size)
                      return (
                        <label
                          key={size}
                          className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-colors cursor-pointer ${checked ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-black'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMainSize(size)}
                            className="hidden"
                          />
                          {size}
                        </label>
                      )
                    })}
                  </div>
                )}

                {mainSizes.filter(s => !availableMainSizes.includes(s)).length > 0 && (
                  <div className="mt-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Custom Choices</p>
                    <div className="flex flex-wrap gap-2">
                      {mainSizes.filter(s => !availableMainSizes.includes(s)).map(s => (
                        <span key={s} className="flex items-center gap-2 px-3 py-2 bg-zinc-100 text-zinc-800 text-[10px] font-black uppercase tracking-widest rounded-lg border border-zinc-200">
                          {s}
                          <Trash2 size={10} className="cursor-pointer hover:text-red-500" onClick={() => toggleMainSize(s)} />
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
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
            {/* CLOTHING TYPE — visible for all categories */}
            {isClothingLike && (
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Size Type</label>
                <select
                  value={clothingType}
                  onChange={e => handleClothingTypeChange(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm border-gray-100 rounded-xl focus:outline-none focus:ring-0 focus:border-black transition-colors appearance-none"
                >
                  <option value="">— None / No sizes —</option>
                  {clothingTypes.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
            )}

            {colors.length > 0 && (
              <div className="space-y-1.5 px-1">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 block px-0.5">Primary Color</label>
                  {category && (
                    <button
                      type="button"
                      onClick={() => setIsColorPickerOpen(isColorPickerOpen === 'main' ? false : 'main')}
                      className="text-[9px] font-black uppercase text-blue-500 hover:text-blue-700 font-black tracking-tighter"
                    >
                      {isColorPickerOpen === 'main' ? 'Close Picker' : 'Set Custom'}
                    </button>
                  )}
                </div>

                {isColorPickerOpen === 'main' ? (
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex gap-3 items-center">
                      <div className="relative group">
                        <Input
                          type="color"
                          value={newColorHex}
                          onChange={e => setNewColorHex(e.target.value)}
                          className="w-12 h-12 p-0 border-2 border-white rounded-full overflow-hidden shadow-md cursor-pointer ring-1 ring-zinc-200"
                        />
                        <div className="absolute inset-0 rounded-full pointer-events-none border border-black/5"></div>
                      </div>
                      <Input
                        placeholder="Color Name (e.g. Midnight Black)"
                        value={newColorName}
                        onChange={e => setNewColorName(e.target.value)}
                        className="flex-1 bg-white text-xs border-zinc-200 rounded-xl h-10 font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleEyeDropper}
                        className="h-9 text-[8px] sm:text-[9px] uppercase font-black tracking-tight sm:tracking-widest border-zinc-200 text-zinc-600 hover:bg-zinc-100 rounded-xl flex items-center justify-center gap-1.5 px-2"
                      >
                        <span className="text-sm">👁️</span>
                        <span className="hidden xs:inline">Screen Pick</span>
                        <span className="xs:hidden">Screen</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsImagePickerOpen(true)}
                        className="h-9 text-[8px] sm:text-[9px] uppercase font-black tracking-tight sm:tracking-widest border-zinc-200 text-zinc-600 hover:bg-zinc-100 rounded-xl flex items-center justify-center gap-1.5 px-2"
                      >
                        <span className="text-sm">🖼️</span>
                        <span className="hidden xs:inline">Image Pick</span>
                        <span className="xs:hidden">Image</span>
                      </Button>
                    </div>

                    <Button
                      type="button"
                      onClick={async () => {
                        const cid = await handleCreateCustomColor()
                        if (cid) setColor(cid)
                      }}
                      disabled={creatingColor || !newColorName.trim()}
                      className="w-full h-10 text-[10px] uppercase font-black tracking-widest bg-black hover:bg-zinc-800 text-white shadow-lg rounded-xl transition-all active:scale-95"
                    >
                      {creatingColor ? 'Processing...' : 'Create & Apply Color'}
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-full h-11 pl-4 pr-10 py-2 text-sm border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all appearance-none bg-white font-medium text-gray-700 shadow-sm"
                    >
                      <option value="">Select Base Color</option>
                      {colors.map(c => (
                        <option key={c._id} value={c._id}>
                          {c.name} {c.hex ? `(${c.hex})` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                )}
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

      {/* ══════ VARIANTS ══════ */}
      <div className="border-t border-gray-50 pt-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[.2em] text-gray-900">Product Variants</h3>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
              Each variant = a different colour. Customer picks colour → then picks 1 size → adds to cart.
            </p>
          </div>
          <Button type="button" onClick={addVariant} variant="outline" className="rounded-xl text-[10px] uppercase font-black tracking-widest border-black hover:bg-black hover:text-white">+ Add Variant</Button>
        </div>

        {variants.length > 0 ? (
          <div className="space-y-4">
            {variants.map((v, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-6 gap-4 items-end relative group">
                {/* SKU */}
                <div className="md:col-span-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">SKU</label>
                  <Input value={v.sku} readOnly className="rounded-xl border-gray-100 bg-white font-mono text-[10px]" />
                  {errors[`sku_${idx}`] && <p className="text-red-500 text-[8px] mt-1 font-bold uppercase">{errors[`sku_${idx}`]}</p>}
                </div>

                {/* COLOR */}
                <div className="col-span-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block m-0 p-0 truncate">Color</label>
                    {category && (
                      <button
                        type="button"
                        onClick={() => setIsColorPickerOpen(idx)}
                        className="text-[7px] font-black uppercase text-blue-500 hover:text-blue-700 shrink-0"
                      >
                        {isColorPickerOpen === idx ? 'Close' : '+ New'}
                      </button>
                    )}
                  </div>

                  {isColorPickerOpen === idx ? (
                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3 relative z-10 w-[220px] shadow-2xl absolute right-0 mt-2 backdrop-blur-sm">
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          value={newColorHex}
                          onChange={e => setNewColorHex(e.target.value)}
                          className="w-10 h-10 p-0 border-0 rounded-lg overflow-hidden shadow-sm cursor-pointer"
                        />
                        <Input
                          placeholder="Color Name..."
                          value={newColorName}
                          onChange={e => setNewColorName(e.target.value)}
                          className="h-10 text-[10px] bg-white border-blue-100 px-2 flex-1 font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {window.EyeDropper && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleEyeDropper}
                            className="h-9 text-[8px] sm:text-[9px] uppercase font-black tracking-tight sm:tracking-widest border-zinc-200 text-zinc-600 hover:bg-zinc-100 rounded-xl flex items-center justify-center gap-1.5 px-2"
                          >
                            <span className="text-sm">👁️</span>
                            <span className="hidden xs:inline">Screen Pick</span>
                            <span className="xs:hidden">Screen</span>
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsImagePickerOpen(idx)}
                          className={`h-9 text-[8px] sm:text-[9px] uppercase font-black tracking-tight sm:tracking-widest border-zinc-200 text-zinc-600 hover:bg-zinc-100 rounded-xl flex items-center justify-center gap-1.5 px-2 ${!window.EyeDropper ? 'col-span-2' : ''}`}
                        >
                          <span className="text-sm">🖼️</span>
                          <span className="hidden xs:inline">Image Pick</span>
                          <span className="xs:hidden">Image</span>
                        </Button>
                      </div>

                      <Button
                        type="button"
                        onClick={async () => {
                          const cid = await handleCreateCustomColor()
                          if (cid) updateVariant(idx, 'color', cid)
                        }}
                        disabled={creatingColor || !newColorName.trim()}
                        className="w-full h-9 text-[9px] uppercase font-black bg-black hover:bg-zinc-800 text-white rounded-xl shadow-sm mt-2 transition-all active:scale-95"
                      >
                        {creatingColor ? 'Processing...' : 'Create & Apply'}
                      </Button>
                    </div>
                  ) : (
                    <select value={v.options.color} onChange={e => updateVariant(idx, 'color', e.target.value)} className="w-full h-10 px-2 py-2 text-[10px] border-white bg-white rounded-xl focus:outline-none focus:ring-0 truncate pr-6 appearance-none">
                      <option value="">Select</option>
                      {colors.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* SIZE — dropdown for clothing types */}
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                    {categories.find(c => c._id === category)?.name?.toLowerCase().includes('electronics') ? 'Specification' : 'Size'}
                    {clothingType && !categories.find(c => c._id === category)?.name?.toLowerCase().includes('electronics') && (
                      <span className="ml-1 normal-case font-normal text-gray-300">({clothingType})</span>
                    )}
                  </label>
                  {clothingType ? (
                    <select
                      value={v.options.size}
                      onChange={e => updateVariant(idx, 'size', e.target.value)}
                      className="w-full h-10 px-3 py-2 text-[10px] border-white bg-white rounded-xl focus:outline-none focus:ring-0"
                    >
                      <option value="">— Pick size —</option>
                      {getSizesForType(clothingType).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      value={v.options.size}
                      onChange={e => updateVariant(idx, 'size', e.target.value)}
                      placeholder="e.g. One Size"
                      className="rounded-xl border-white bg-white text-[10px]"
                    />
                  )}
                </div>

                {/* PRICE */}
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Price (₦)</label>
                  <Input type="number" value={v.price} onChange={e => updateVariant(idx, 'price', e.target.value)} className="rounded-xl border-white bg-white text-[10px]" />
                  {errors[`price_${idx}`] && <p className="text-red-500 text-[8px] mt-1 font-bold uppercase">{errors[`price_${idx}`]}</p>}
                </div>

                {/* DISCOUNT */}
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Discount (%)</label>
                  <Input type="number" value={v.discount || 0} onChange={e => updateVariant(idx, 'discount', e.target.value)} className="rounded-xl border-white bg-white text-[10px]" />
                </div>

                {/* STOCK + IMAGE + DELETE */}
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
            No variants added. Base pricing, stock, and sizes above will apply.
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-8 border-t border-gray-50">
        <Button type="submit" className="bg-black text-white hover:bg-zinc-800 rounded-xl px-12 py-6 font-black uppercase tracking-widest text-[10px]">Publish Product</Button>
        <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl px-8 py-6 font-bold uppercase tracking-widest text-[10px] text-gray-400">Cancel</Button>
      </div>

      {/* ── IMAGE COLOR PICKER MODAL (Mobile Fallback) ── */}
      {
        isImagePickerOpen && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
            <div className="p-4 flex justify-between items-center border-b border-white/10">
              <h3 className="text-white text-xs font-black uppercase tracking-widest">Tap to pick color</h3>
              <button type="button" onClick={() => setIsImagePickerOpen(false)} className="text-white/60 hover:text-white">
                <Trash2 size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 select-none touch-none">
              {[...existingImages, ...imagePreviews.map(p => ({ url: p }))].map((img, i) => (
                <div key={i} className="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900">
                  <img
                    src={img.url}
                    crossOrigin="anonymous"
                    className="w-full cursor-crosshair opacity-90"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      const target = e.currentTarget;
                      const rect = target.getBoundingClientRect();

                      // Create a persistent canvas for sampling
                      const sampleCanvas = document.createElement('canvas');
                      sampleCanvas.width = target.naturalWidth;
                      sampleCanvas.height = target.naturalHeight;
                      const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
                      sCtx.drawImage(target, 0, 0);

                      const sample = (ev) => {
                        const x = ((ev.clientX - rect.left) / rect.width) * target.naturalWidth;
                        const y = ((ev.clientY - rect.top) / rect.height) * target.naturalHeight;

                        if (x < 0 || x > target.naturalWidth || y < 0 || y > target.naturalHeight) return;

                        const pixel = sCtx.getImageData(x, y, 1, 1).data;
                        const hex = '#' + ('000000' + ((pixel[0] << 16) | (pixel[1] << 8) | pixel[2]).toString(16)).slice(-6);

                        // Zoom logic: draw a small patch around (x,y) to a magnifier canvas
                        const zoomSize = 20; // 20x20 area
                        const zoomCanvas = document.createElement('canvas');
                        zoomCanvas.width = 100;
                        zoomCanvas.height = 100;
                        const zCtx = zoomCanvas.getContext('2d');
                        zCtx.imageSmoothingEnabled = false; // Keep it pixelated for precision
                        zCtx.drawImage(
                          target,
                          x - zoomSize / 2, y - zoomSize / 2, zoomSize, zoomSize,
                          0, 0, 100, 100
                        );

                        setMagnifier({
                          show: true,
                          x: ev.clientX,
                          y: ev.clientY - 100,
                          hex,
                          zoomData: zoomCanvas.toDataURL()
                        });
                        return hex;
                      };

                      const onMove = (moveEv) => sample(moveEv);
                      const onUp = async (upEv) => {
                        const finalHex = sample(upEv);
                        if (finalHex) {
                          setNewColorHex(finalHex);
                          const copied = await copyToClipboard(finalHex);
                          toast({
                            title: copied ? `Color captured & copied: ${finalHex}` : `Color captured: ${finalHex}`,
                            description: copied ? "Ready to use in the form!" : "(Clipboard blocked, but color is set in form)"
                          });
                        }
                        setMagnifier({ show: false, x: 0, y: 0, hex: '#000000' });
                        setIsImagePickerOpen(false);
                        window.removeEventListener('pointermove', onMove);
                        window.removeEventListener('pointerup', onUp);
                      };

                      sample(e);
                      window.addEventListener('pointermove', onMove);
                      window.addEventListener('pointerup', onUp);
                    }}
                  />
                </div>
              ))}

              {/* Enhanced Magnifier Glass */}
              {magnifier.show && (
                <div
                  className="fixed z-[120] pointer-events-none -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                  style={{ left: magnifier.x, top: magnifier.y }}
                >
                  <div className="relative w-28 h-28 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-zinc-800">
                    {magnifier.zoomData && (
                      <img src={magnifier.zoomData} className="w-full h-full object-cover" />
                    )}
                    {/* Crosshair */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-[1px] bg-white/50" />
                      <div className="absolute w-[1px] h-full bg-white/50" />
                      <div className="w-2 h-2 border-2 border-white rounded-full shadow-[0_0_5px_rgba(0,0,0,0.5)]" />
                    </div>
                    {/* Sample Color circle */}
                    <div
                      className="absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-white shadow-lg"
                      style={{ backgroundColor: magnifier.hex }}
                    />
                  </div>
                  <div className="mt-3 bg-black/80 backdrop-blur-md text-white text-[11px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border border-white/20">
                    {magnifier.hex}
                  </div>
                </div>
              )}

              {existingImages.length === 0 && imagePreviews.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-white/40 text-sm">
                  No images available to pick from.
                </div>
              )}
            </div>
          </div>
        )
      }
    </form >
  )
}
