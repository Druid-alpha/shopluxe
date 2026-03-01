import React, { useEffect, useState, useMemo } from 'react'
import { Slider } from './ui/slider'
import axios from '@/lib/axios'

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
  setClothingType
}) {
  const [range, setRange] = useState([minPrice, maxPrice])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [colors, setColors] = useState([])
  const [clothingTypes, setClothingTypes] = useState([])
  const [loading, setLoading] = useState(false)

  // ---------------- Derived values ----------------
  const selectedCategoryObj = useMemo(
    () =>
      categories.find(
        c =>
          String(c._id) === String(category) ||
          c.name.toLowerCase() === category?.toLowerCase()
      ),
    [categories, category]
  )
  const isClothing = selectedCategoryObj?.name?.toLowerCase() === 'clothing'

  // ---------------- Load filter options ----------------
  const loadFilters = async () => {
    setLoading(true)
    try {
      const params = { category: category || undefined }
      if (isClothing && clothingType) params.clothingType = clothingType

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/products/filters`, { params })

      setCategories(res.data.categories || [])
      setBrands(res.data.brands || [])
      setColors(res.data.colors || [])
      setClothingTypes(res.data.clothingTypes || [])

      // Reset invalid selections
      if (brand && !res.data.brands.some(b => b._id === brand)) setBrand(null)
      if (clothingType && !res.data.clothingTypes.includes(clothingType)) setClothingType(null)
    } catch (err) {
      console.error('Failed to load filters', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFilters()
  }, [category, clothingType, isClothing])

  // ---------------- Price slider ----------------
  useEffect(() => setRange([minPrice, maxPrice]), [minPrice, maxPrice])
  const handlePriceChange = (values) => {
    setRange(values)
    setMinPrice(values[0])
    setMaxPrice(values[1])
  }

  // ---------------- Reset dependent filters ----------------
  useEffect(() => {
    // When category changes → reset clothingType & brand
    setClothingType(null)
    setBrand(null)
  }, [category])

  useEffect(() => {
    // When clothingType changes → reset brand
    if (!isClothing) setClothingType(null)
    setBrand(null)
  }, [clothingType, isClothing])

  // ---------------- Render ----------------
  return (
    <div className={`flex flex-col gap-6 mb-6 transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      {/* CATEGORY */}
      <div>
        <label className="block mb-2 font-medium">Category:</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setCategory(null); setClothingType(null); setBrand(null) }}
            className={`px-4 py-2 rounded border text-sm ${!category ? 'bg-black text-white' : 'bg-white'}`}
          >
            All
          </button>
          {categories.map(c => (
            <button
              key={c._id}
              onClick={() => { setCategory(c._id); setClothingType(null); setBrand(null) }}
              className={`px-4 py-2 rounded border text-sm ${category === c._id ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* CLOTHING TYPE */}
      {isClothing && clothingTypes.length > 0 && (
        <div>
          <label className="block mb-2 font-medium">Type:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setClothingType(null)} // ✅ sends null for "All Types"
              className={`px-4 py-2 rounded border text-sm ${!clothingType ? 'bg-black text-white' : 'bg-white'}`}
            >
              All Types
            </button>
            {clothingTypes.map(t => (
              <button
                key={t}
                onClick={() => setClothingType(t)}
                className={`px-4 py-2 rounded border text-sm ${clothingType === t ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BRAND */}
      {brands.length > 0 && (
        <div>
          <label className="block mb-2 font-medium">Brand:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setBrand(null)}
              className={`px-4 py-2 rounded border text-sm ${!brand ? 'bg-black text-white' : 'bg-white'}`}
            >
              All
            </button>
            {brands.map(b => (
              <button
                key={b._id}
                onClick={() => setBrand(b._id)}
                className={`px-4 py-2 rounded border text-sm ${brand === b._id ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* COLOR */}
      {colors.length > 0 && (
        <div>
          <label className="block mb-2 font-medium">Color:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setColor(null)}
              className={`px-3 py-1 text-sm border rounded ${!color ? 'bg-black text-white' : 'bg-white'}`}
            >
              All
            </button>
            {colors.map(c => (
              <button
                key={c._id}
                title={c.name}
                onClick={() => setColor(c._id)}
                className={`w-8 h-8 rounded-full border-2 ${color === c._id ? 'border-black scale-110' : 'border-gray-300'}`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {/* PRICE */}
      <div>
        <label className="block mb-2 font-medium">Price:</label>
        <Slider value={range} onValueChange={handlePriceChange} min={0} max={5000000} step={500} />
        <div className="flex justify-between mt-1 text-sm">
          <span>₦{range[0]}</span>
          <span>₦{range[1]}</span>
        </div>
      </div>
    </div>
  )
}
