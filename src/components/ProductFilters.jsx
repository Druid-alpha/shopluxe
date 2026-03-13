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
  const normalizeHex = React.useCallback((hex) => {
    if (!hex) return ''
    let h = String(hex).trim().toLowerCase()
    if (!h.startsWith('#')) h = `#${h}`
    if (h.length === 4) {
      h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
    }
    return h
  }, [])
  const hexToRgb = React.useCallback((hex) => {
    const h = normalizeHex(hex).replace('#', '')
    if (h.length !== 6) return null
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    if ([r, g, b].some(Number.isNaN)) return null
    return { r, g, b }
  }, [normalizeHex])
  const rgbToHsl = React.useCallback(({ r, g, b }) => {
    const rn = r / 255
    const gn = g / 255
    const bn = b / 255
    const max = Math.max(rn, gn, bn)
    const min = Math.min(rn, gn, bn)
    const delta = max - min
    let h = 0
    let s = 0
    const l = (max + min) / 2
    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)
      switch (max) {
        case rn:
          h = (gn - bn) / delta + (gn < bn ? 6 : 0)
          break
        case gn:
          h = (bn - rn) / delta + 2
          break
        default:
          h = (rn - gn) / delta + 4
      }
      h *= 60
    }
    return { h, s, l }
  }, [])
  const getFamilyFromName = React.useCallback((name) => {
    const n = String(name || '').toLowerCase()
    if (!n) return ''
    if (n.includes('white') || n.includes('ivory') || n.includes('cream')) return 'White'
    if (n.includes('black') || n.includes('obsidian') || n.includes('jet')) return 'Black'
    if (n.includes('gray') || n.includes('grey') || n.includes('silver') || n.includes('charcoal')) return 'Gray'
    if (n.includes('brown') || n.includes('tan') || n.includes('beige') || n.includes('camel') || n.includes('coffee')) return 'Brown'
    if (n.includes('red') || n.includes('crimson') || n.includes('maroon') || n.includes('burgundy')) return 'Red'
    if (n.includes('pink') || n.includes('rose') || n.includes('fuchsia') || n.includes('magenta')) return 'Pink'
    if (n.includes('orange') || n.includes('amber') || n.includes('tangerine')) return 'Orange'
    if (n.includes('yellow') || n.includes('gold')) return 'Yellow'
    if (n.includes('green') || n.includes('emerald') || n.includes('lime')) return 'Green'
    if (n.includes('teal') || n.includes('aqua') || n.includes('turquoise')) return 'Teal'
    if (n.includes('blue') || n.includes('navy') || n.includes('azure')) return 'Blue'
    if (n.includes('purple') || n.includes('violet') || n.includes('indigo')) return 'Purple'
    return ''
  }, [])
  const getColorFamily = React.useCallback((color) => {
    const nameFamily = getFamilyFromName(color?.name || '')
    if (nameFamily) return nameFamily
    const rgb = hexToRgb(color?.hex)
    if (!rgb) return ''
    const { h, s, l } = rgbToHsl(rgb)
    if (l <= 0.12) return 'Black'
    if (l >= 0.9) return 'White'
    if (s < 0.15) return 'Gray'
    if (h < 15 || h >= 345) return 'Red'
    if (h < 40) return 'Orange'
    if (h < 65) return 'Yellow'
    if (h < 150) return 'Green'
    if (h < 190) return 'Teal'
    if (h < 255) return 'Blue'
    if (h < 300) return 'Purple'
    return 'Pink'
  }, [getFamilyFromName, hexToRgb, rgbToHsl])
  const FAMILY_SWATCH = {
    Red: '#ef4444',
    Orange: '#f97316',
    Yellow: '#eab308',
    Green: '#22c55e',
    Teal: '#14b8a6',
    Blue: '#3b82f6',
    Purple: '#8b5cf6',
    Pink: '#ec4899',
    Brown: '#8b5a2b',
    Black: '#111111',
    White: '#f5f5f5',
    Gray: '#9ca3af'
  }
  const FAMILY_ORDER = ['Black', 'White', 'Gray', 'Brown', 'Red', 'Orange', 'Yellow', 'Green', 'Teal', 'Blue', 'Purple', 'Pink']
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
  const selectedColorSet = React.useMemo(() => new Set(selectedColors), [selectedColors])
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

  const colorFamilies = React.useMemo(() => {
    const groups = new Map()
    colors.forEach(c => {
      const family = getColorFamily(c)
      if (!family) return
      if (!groups.has(family)) groups.set(family, [])
      groups.get(family).push(c)
    })
    return Array.from(groups.entries()).map(([family, values]) => ({
      family,
      colors: values
    })).sort((a, b) => {
      const ai = FAMILY_ORDER.indexOf(a.family)
      const bi = FAMILY_ORDER.indexOf(b.family)
      if (ai === -1 && bi === -1) return a.family.localeCompare(b.family)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }, [colors, getColorFamily])

  const handleFamilyToggle = (family) => {
    const ids = family.colors.map(c => String(c._id))
    const isSelected = ids.some(id => selectedColorSet.has(id))
    const updated = isSelected
      ? selectedColors.filter(id => !ids.includes(id))
      : [...selectedColors, ...ids.filter(id => !selectedColorSet.has(id))]
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
      {colorFamilies.length > 0 && (
        <div className="border-b border-gray-100">
          <SectionHeader title="Color Families" section="colors" isOpen={openSections.colors} />
          {openSections.colors && (
            <div className="py-6 grid grid-cols-3 gap-4">
              {colorFamilies.map(family => {
                const isSelected = family.colors.some(c => selectedColorSet.has(String(c._id)))
                const hex =
                  family.colors.find(c => c.hex)?.hex ||
                  FAMILY_SWATCH[family.family] ||
                  '#9ca3af'
                const cleanHex = normalizeHex(hex)

                return (
                  <button
                    key={family.family}
                    title={family.family}
                    onClick={() => handleFamilyToggle(family)}
                    className={`flex items-center gap-3 w-full text-left rounded-xl border-2 px-3 py-2 transition-all ${isSelected ? 'border-black shadow-md' : 'border-gray-200 hover:border-gray-400'}`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full border ${cleanHex === '#ffffff' ? 'border-gray-300' : 'border-transparent'}`}
                      style={{ backgroundColor: cleanHex }}
                    />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-black' : 'text-gray-400'}`}>
                      {family.family}
                    </span>
                  </button>
                )
              })}
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

