import * as React from 'react'
import { Slider } from './ui/slider'
import axios from '@/lib/axios'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function ProductFilters({
  category,
  setCategory,
  brand, 
  setBrand,
  color, 
  setColor,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  clothingType,
  setClothingType,
  availability,
  setAvailability
}) {
  const MAX_PRICE = 5000000
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
  const normalizeClothingType = React.useCallback((type) => {
    if (!type) return ''
    return type === 'bag' ? 'bags' : type
  }, [])
  const [categories, setCategories] = React.useState([])
  const [brands, setBrands] = React.useState([])
  const [colors, setColors] = React.useState([])
  const [clothingTypes, setClothingTypes] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [openSections, setOpenSections] = React.useState({
    categories: true,
    types: true,
    brands: true,
    colors: true,
    availability: true,
    price: true
  })

  // ---------------- Derived values ----------------
  const selectedCategoryObj = React.useMemo(
    () =>
      categories.find(
        c =>
          String(c._id) === String(category) ||
          c.name.toLowerCase() === category?.toLowerCase()
      ),
    [categories, category]
  )
  const isClothing = selectedCategoryObj?.name?.toLowerCase() === 'clothing'

  const selectedBrands = React.useMemo(
    () => (brand ? brand.split(',').map(v => v.trim()).filter(Boolean) : []),
    [brand]
  )
  const selectedColors = React.useMemo(
    () => (color ? color.split(',').map(v => v.trim()).filter(Boolean) : []),
    [color]
  )
  const selectedAvailability = React.useMemo(
    () => (availability ? availability.split(',').map(v => v.trim()).filter(Boolean) : []),
    [availability]
  )

  // ---------------- Load filter options ----------------
  const loadFilters = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = { category: isObjectId(category) ? category : undefined }
      if (isClothing && clothingType) params.clothingType = normalizeClothingType(clothingType)

      const res = await axios.get('/products/filters', { params })

      setCategories(res.data.categories || [])
      setBrands(res.data.brands || [])
      const rawColors = res.data.colors || []
      const seenColorKeys = new Set()
      const normalizedColors = rawColors.filter(c => {
        if (!c || (!c.name && !c.hex)) return false
        const key = String(c.hex || c.name || c._id || '').toLowerCase()
        if (!key || seenColorKeys.has(key)) return false
        seenColorKeys.add(key)
        return true
      })
      setColors(normalizedColors.slice(0, 10))
      const normalizedTypes = [...new Set((res.data.clothingTypes || []).map((t) => normalizeClothingType(t)))]
      setClothingTypes(normalizedTypes)
    } catch (err) {
      console.error('Failed to load filters', err)
    } finally {
      setLoading(false)
    }
  }, [category, clothingType, isClothing, isObjectId, normalizeClothingType])

  React.useEffect(() => {
    loadFilters()
  }, [loadFilters])

  React.useEffect(() => {
    if (!category || isObjectId(category) || categories.length === 0) return
    const incoming = normalizeCategoryLabel(category)
    const match = categories.find((c) => normalizeCategoryLabel(c?.name) === incoming)
    if (match?._id) setCategory(String(match._id))
  }, [category, categories, isObjectId, normalizeCategoryLabel, setCategory])

  // ---------------- Toggles ----------------
  const toggleSection = (section) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))

  const handleBrandToggle = (id) => {
    const brandId = String(id)
    const updated = selectedBrands.includes(brandId)
      ? selectedBrands.filter(b => b !== brandId)
      : [...selectedBrands, brandId]
    const nextBrand = updated.length ? updated.join(',') : null
    if (nextBrand !== brand) setBrand(nextBrand)
  }

  const handleColorToggle = (id) => {
    const updated = selectedColors.includes(id)
      ? selectedColors.filter(c => c !== id)
      : [...selectedColors, id]
    const nextColor = updated.length ? updated.join(',') : null
    if (nextColor !== color) setColor(nextColor)
  }

  const handleAvailabilityToggle = (val) => {
    const updated = selectedAvailability.includes(val)
      ? selectedAvailability.filter(a => a !== val)
      : [...selectedAvailability, val]
    const nextAvailability = updated.length ? updated.join(',') : null
    if (nextAvailability !== availability) setAvailability(nextAvailability)
  }

  // ---------------- Price slider ----------------
  const handlePriceChange = (values) => {
    const [nextMin, nextMax] = values
    if (nextMin !== minPrice) setMinPrice(nextMin)
    if (nextMax !== maxPrice) setMaxPrice(nextMax)
  }

  // ---------------- Render Helpers ----------------
  const SectionHeader = ({ title, section, isOpen }) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 border-b border-gray-50 hover:text-gray-500 transition-colors"
    >
      {title}
      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
  )

  return (
    <div className={`space-y-2 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>

      {/* CLEAR ALL */}
      {(category || brand || color || minPrice > 0 || maxPrice < MAX_PRICE || availability || clothingType) && (
        <button
          onClick={() => {
            setCategory(''); setBrand(null); setColor(null);
            setMinPrice(0); setMaxPrice(MAX_PRICE); setAvailability(null); setClothingType(null);
          }}
          className="w-full py-2 mb-4 text-[10px] font-black uppercase tracking-widest text-white bg-black hover:bg-zinc-800 transition-colors rounded-none"
        >
          Clear All Filters
        </button>
      )}

      {/* CATEGORIES */}
      <div className="border-b border-gray-100">
        <SectionHeader title="Categories" section="categories" isOpen={openSections.categories} />
        {openSections.categories && (
          <div className="py-6 space-y-3">
            <button
              onClick={() => { setCategory(''); setClothingType(null); setBrand(null); setColor(null) }}
              className={`block w-full text-left text-xs font-bold uppercase tracking-widest hover:text-black transition-colors ${!category ? 'text-black' : 'text-gray-400'}`}
            >
              All Categories
            </button>
            {categories.map(c => (
              <button
                key={c._id}
                onClick={() => { setCategory(String(c._id)); setClothingType(null); setBrand(null); setColor(null) }}
                className={`block w-full text-left text-xs font-bold uppercase tracking-widest hover:text-black transition-colors ${String(selectedCategoryObj?._id || '') === String(c._id) ? 'text-black' : 'text-gray-400'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CLOTHING TYPE */}
      {isClothing && clothingTypes.length > 0 && (
        <div className="border-b border-gray-100">
          <SectionHeader title="Clothing Type" section="types" isOpen={openSections.types} />
          {openSections.types && (
            <div className="py-6 space-y-3">
              <button
                onClick={() => setClothingType(null)}
                className={`block w-full text-left text-xs font-bold uppercase tracking-widest hover:text-black transition-colors ${!clothingType ? 'text-black' : 'text-gray-400'}`}
              >
                All Types
              </button>
              {clothingTypes.map(t => (
                <button
                  key={t}
                  onClick={() => setClothingType(normalizeClothingType(t))}
                  className={`block w-full text-left text-xs font-bold uppercase tracking-widest hover:text-black transition-colors ${normalizeClothingType(clothingType) === t ? 'text-black' : 'text-gray-400'}`}
                >
                  {t === 'bags' ? 'Bags' : t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BRANDS */}
      {brands.length > 0 && (
        <div className="border-b border-gray-100">
          <SectionHeader title="Brands" section="brands" isOpen={openSections.brands} />
          {openSections.brands && (
            <div className="py-6 space-y-4">
              {brands.map(b => (
                <div key={b._id} className="flex items-center gap-3 group cursor-pointer" onClick={() => handleBrandToggle(b._id)}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedBrands.includes(String(b._id)) ? 'bg-black border-black shadow-lg' : 'border-gray-200 bg-white group-hover:border-gray-400'}`}>
                    {selectedBrands.includes(String(b._id)) && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${selectedBrands.includes(String(b._id)) ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    {b.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COLORS */}
      {colors.length > 0 && (
        <div className="border-b border-gray-100">
          <SectionHeader title="Colors" section="colors" isOpen={openSections.colors} />
          {openSections.colors && (
            <div className="py-6 grid grid-cols-5 gap-3">
              {colors.map(c => (
                <button
                  key={c._id}
                  title={c.name}
                  onClick={() => handleColorToggle(c._id)}
                  className={`w-8 h-8 rounded-full border-2 transition-all relative ${selectedColors.includes(c._id) ? 'border-black scale-110 shadow-md ring-2 ring-black/5' : 'border-gray-200 hover:border-gray-400'}`}
                  style={{ backgroundColor: c.hex }}
                >
                  {selectedColors.includes(c._id) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full ${c.hex.toLowerCase() === '#ffffff' ? 'bg-black' : 'bg-white shadow-sm'}`} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AVAILABILITY */}
      <div className="border-b border-gray-100">
        <SectionHeader title="Availability" section="availability" isOpen={openSections.availability} />
        {openSections.availability && (
          <div className="py-6 space-y-4">
            {[
              { label: 'In Stock', value: 'in_stock' },
              { label: 'Out of Stock', value: 'out_of_stock' }
            ].map(a => (
              <div key={a.value} className="flex items-center gap-3 group cursor-pointer" onClick={() => handleAvailabilityToggle(a.value)}>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedAvailability.includes(a.value) ? 'bg-black border-black shadow-lg' : 'border-gray-200 bg-white group-hover:border-gray-400'}`}>
                  {selectedAvailability.includes(a.value) && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${selectedAvailability.includes(a.value) ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  {a.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PRICE */}
      <div className="border-b border-gray-100">
        <SectionHeader title="Price Range" section="price" isOpen={openSections.price} />
        {openSections.price && (
          <div className="py-10 px-2 space-y-6">
            <Slider value={[minPrice, maxPrice]} onValueChange={handlePriceChange} min={0} max={MAX_PRICE} step={100} />
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="text-center">
                <span className="block text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Min</span>
                <span className="text-[10px] font-black text-slate-900">₦{minPrice.toLocaleString()}</span>
              </div>
              <div className="h-4 w-px bg-gray-200" />
              <div className="text-center">
                <span className="block text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Max</span>
                <span className="text-[10px] font-black text-slate-900">₦{maxPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

