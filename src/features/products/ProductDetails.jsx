import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetProductQuery, useGetReviewsQuery } from './productApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { addGuestCart } from '../cart/cartSlice'
import { toggleGuestWishlist } from '../wishlist/wishlistSlice'
import { setCart } from '../cart/cartSlice'
import * as cartApi from '../cart/cartApi'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import ReviewForm from './ReviewForm'
import ReviewList from './ReviewList'
import {
  useToggleWishlistMutation,
  useGetWishlistQuery
} from '../wishlist/wishlistApi'
import StarRating from './StarRating'
import { Heart } from 'lucide-react'
import PriceDisplay from '@/components/PriceDisplay'
import ReviewSummary from './ReviewSummary'


const getImageUrl = (img) => {
  if (!img) return ''
  if (typeof img === 'string') return img
  return img.url || ''
}

const CLOTHING_SIZE_LABELS = {
  clothes: 'Clothing Size',
  shoes: 'Shoe Size',
  bags: 'Bag Size',
  eyeglass: 'Frame Size'
}

// Build a hex color for button styling; fallback to #111 (near-black)
const isHexLike = (value) => /^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(String(value || ''))

const resolveHex = (rawColor) => {
  if (!rawColor) return null
  if (typeof rawColor === 'string') {
    if (rawColor.startsWith('#')) return rawColor
    if (isHexLike(rawColor)) return `#${rawColor}`
    return null
  }
  if (typeof rawColor === 'object' && rawColor.hex) return rawColor.hex
  return null
}

const HEX_NAME_MAP = {
  '#000000': 'Midnight Black',
  '#0f172a': 'Midnight',
  '#111111': 'Jet Black',
  '#1f2937': 'Charcoal',
  '#374151': 'Graphite',
  '#6b7280': 'Slate Gray',
  '#9ca3af': 'Steel Gray',
  '#d1d5db': 'Silver',
  '#e5e7eb': 'Cloud',
  '#f5f5f5': 'Soft White',
  '#ffffff': 'Pure White',
  '#fff5f5': 'Blush',
  '#ffe4e6': 'Rose Quartz',
  '#fecdd3': 'Petal',
  '#fda4af': 'Coral Pink',
  '#fb7185': 'Watermelon',
  '#ef4444': 'Crimson',
  '#dc2626': 'Ruby',
  '#b91c1c': 'Garnet',
  '#991b1b': 'Burgundy',
  '#7f1d1d': 'Merlot',
  '#fff1f2': 'Soft Rose',
  '#ffe4b5': 'Peach',
  '#fed7aa': 'Apricot',
  '#f97316': 'Tangerine',
  '#ea580c': 'Burnt Orange',
  '#c2410c': 'Clay',
  '#9a3412': 'Cinnamon',
  '#78350f': 'Mocha',
  '#ffedd5': 'Champagne',
  '#fef3c7': 'Butter',
  '#fde68a': 'Honey',
  '#f59e0b': 'Amber',
  '#d97706': 'Ochre',
  '#b45309': 'Bronze',
  '#92400e': 'Caramel',
  '#facc15': 'Gold',
  '#eab308': 'Sunflower',
  '#fde047': 'Lemon',
  '#fef08a': 'Mellow Yellow',
  '#ecfccb': 'Pistachio',
  '#d9f99d': 'Lime Cream',
  '#a3e635': 'Lime',
  '#84cc16': 'Chartreuse',
  '#4d7c0f': 'Moss',
  '#22c55e': 'Emerald',
  '#16a34a': 'Jade',
  '#15803d': 'Forest',
  '#166534': 'Pine',
  '#dcfce7': 'Mint',
  '#bbf7d0': 'Seafoam',
  '#86efac': 'Spring Green',
  '#34d399': 'Tropical Green',
  '#14b8a6': 'Teal',
  '#0d9488': 'Deep Teal',
  '#0f766e': 'Lagoon',
  '#134e4a': 'Evergreen',
  '#ccfbf1': 'Aqua',
  '#99f6e4': 'Ice Mint',
  '#5eead4': 'Turquoise',
  '#2dd4bf': 'Caribbean',
  '#e0f2fe': 'Sky Mist',
  '#bae6fd': 'Sky Blue',
  '#7dd3fc': 'Daylight',
  '#38bdf8': 'Azure',
  '#0ea5e9': 'Bluebird',
  '#3b82f6': 'Royal Blue',
  '#2563eb': 'Cobalt',
  '#1d4ed8': 'Sapphire',
  '#1e3a8a': 'Navy',
  '#0f172a': 'Midnight',
  '#6366f1': 'Indigo',
  '#4f46e5': 'Deep Indigo',
  '#4338ca': 'Iris',
  '#312e81': 'Ink',
  '#e0e7ff': 'Periwinkle',
  '#c7d2fe': 'Lavender Blue',
  '#8b5cf6': 'Violet',
  '#7c3aed': 'Amethyst',
  '#6d28d9': 'Plum',
  '#4c1d95': 'Aubergine',
  '#ede9fe': 'Lilac',
  '#ddd6fe': 'Wisteria',
  '#ec4899': 'Rose',
  '#db2777': 'Fuchsia',
  '#be185d': 'Magenta',
  '#9d174d': 'Wine',
  '#fce7f3': 'Blush Pink',
  '#fbcfe8': 'Pink Mist',
  '#f472b6': 'Hot Pink',
  '#0f766e': 'Lagoon',
  '#0b1020': 'Obsidian',
  '#111827': 'Onyx',
  '#1e293b': 'Storm',
  '#334155': 'Slate',
  '#475569': 'Ash',
  '#64748b': 'Smoke',
  '#94a3b8': 'Mist',
  '#cbd5e1': 'Fog',
  '#e2e8f0': 'Frost',
  '#f8fafc': 'Snow',
  '#fafafa': 'Porcelain',
  '#e8e5e0': 'Ivory',
  '#f7f3e9': 'Cream',
  '#e5e0d8': 'Stone',
  '#d6d3d1': 'Mushroom',
  '#a8a29e': 'Taupe',
  '#78716c': 'Mocha Brown',
  '#57534e': 'Cocoa',
  '#44403c': 'Espresso',
  '#2f2f2f': 'Graphite Black',
  '#3f3f46': 'Steel',
  '#52525b': 'Gunmetal',
  '#71717a': 'Dusty Gray',
  '#a1a1aa': 'Silver Mist',
  '#d4d4d8': 'Pearl',
  '#e4e4e7': 'Porcelain White',
  '#faf0e6': 'Linen',
  '#ffefd5': 'Papaya',
  '#ffe4b5': 'Peach',
  '#f5deb3': 'Wheat',
  '#deb887': 'Sand',
  '#d2b48c': 'Tan',
  '#c19a6b': 'Camel',
  '#b08968': 'Toffee',
  '#8d6e63': 'Cappuccino',
  '#6d4c41': 'Coffee',
  '#5d4037': 'Chocolate',
  '#4e342e': 'Espresso Brown',
  '#3e2723': 'Dark Roast',
  '#e6ccb2': 'Oat',
  '#d4a373': 'Desert',
  '#c68642': 'Sienna',
  '#a0522d': 'Umber',
  '#8b4513': 'Saddle',
  '#7f5539': 'Hazel',
  '#6f4e37': 'Mocha',
  '#ffe5b4': 'Apricot',
  '#ffd1dc': 'Blush Pink',
  '#ffc0cb': 'Pink',
  '#ffb6c1': 'Light Pink',
  '#ffa07a': 'Light Salmon',
  '#ff7f7f': 'Salmon',
  '#ff6f61': 'Coral',
  '#ff4500': 'Vermilion',
  '#ff2400': 'Scarlet',
  '#ff0000': 'Red',
  '#d1001f': 'Cherry',
  '#a40000': 'Oxblood',
  '#800000': 'Maroon',
  '#7c0a02': 'Barn Red',
  '#5c0a00': 'Mahogany',
  '#fff8dc': 'Cornsilk',
  '#fffacd': 'Lemon Cream',
  '#fffdd0': 'Cream',
  '#ffeaa7': 'Vanilla',
  '#ffd700': 'Gold',
  '#ffcc00': 'Sunshine',
  '#f0e68c': 'Khaki',
  '#e6e6fa': 'Lavender',
  '#d8bfd8': 'Thistle',
  '#dda0dd': 'Plum Light',
  '#c8a2c8': 'Lilac Purple',
  '#b19cd9': 'Pastel Violet',
  '#a78bfa': 'Lavender Purple',
  '#8a2be2': 'Blue Violet',
  '#7b68ee': 'Medium Slate Blue',
  '#6a5acd': 'Slate Blue',
  '#4b0082': 'Indigo Deep',
  '#2e1065': 'Deep Purple',
  '#f0f9ff': 'Ice',
  '#e0f7fa': 'Aqua Mist',
  '#b2ebf2': 'Lagoon Light',
  '#80deea': 'Blue Lagoon',
  '#4dd0e1': 'Lagoon Blue',
  '#26c6da': 'Caribbean Blue',
  '#00bcd4': 'Cyan',
  '#00acc1': 'Deep Cyan',
  '#0097a7': 'Teal Blue',
  '#006064': 'Deep Sea',
  '#e3f2fd': 'Sky',
  '#bbdefb': 'Baby Blue',
  '#90caf9': 'Powder Blue',
  '#64b5f6': 'Cornflower',
  '#42a5f5': 'Ocean Blue',
  '#2196f3': 'Blue',
  '#1e88e5': 'Azure Blue',
  '#1976d2': 'Deep Blue',
  '#1565c0': 'Royal Navy',
  '#0d47a1': 'Navy Blue',
  '#f3e5f5': 'Lavender Mist',
  '#e1bee7': 'Orchid',
  '#ce93d8': 'Violet Mist',
  '#ba68c8': 'Purple',
  '#9c27b0': 'Amethyst Purple',
  '#8e24aa': 'Royal Purple',
  '#6a1b9a': 'Plum Purple',
  '#4a148c': 'Deep Purple',
  '#fce4ec': 'Rose Mist',
  '#f8bbd0': 'Rose Pink',
  '#f48fb1': 'Pink Rose',
  '#f06292': 'Bubblegum',
  '#e91e63': 'Hot Rose',
  '#d81b60': 'Raspberry',
  '#ad1457': 'Berry',
  '#880e4f': 'Mulberry',
  '#ede7f6': 'Lavender Gray',
  '#d1c4e9': 'Iris Mist',
  '#b39ddb': 'Soft Lavender',
  '#9575cd': 'Purple Haze',
  '#7e57c2': 'Royal Iris',
  '#673ab7': 'Purple',
  '#5e35b1': 'Deep Iris',
  '#512da8': 'Violet Deep',
  '#4527a0': 'Plum',
  '#311b92': 'Eggplant',
  '#efeae6': 'Pearl White',
  '#656b83': 'Slate Blue'
}

const normalizeHex = (hex) => {
  if (!hex) return ''
  let h = String(hex).trim().toLowerCase()
  if (!h.startsWith('#')) h = `#${h}`
  if (h.length === 4) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
  }
  return h
}

const extractHexFromString = (value) => {
  if (!value) return ''
  const match = String(value).match(/#?[0-9a-fA-F]{6}|#?[0-9a-fA-F]{3}/)
  return match ? normalizeHex(match[0]) : ''
}

const hexToRgb = (hex) => {
  const h = normalizeHex(hex)
  if (!h || h.length !== 7) return null
  return {
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16)
  }
}

const rgbToHsl = (r, g, b) => {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h = Math.round(h * 60)
    if (h < 0) h += 360
  }
  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  return { h, s, l }
}

const familyFromHex = (hex) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return ''
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b)

  if (l <= 0.08) return 'Black'
  if (l >= 0.95) return 'White'

  if (s <= 0.08) {
    if ((h >= 330 || h < 20) && l > 0.35) return 'Pink'
    if (h >= 20 && h < 60) return l > 0.35 ? 'Beige' : 'Brown'
    if (h >= 60 && h < 170) return 'Olive'
    if (h >= 170 && h < 250) return 'Blue Gray'
    return 'Gray'
  }

  if (h >= 330 || h < 15) return 'Red'
  if (h < 45) return 'Orange'
  if (h < 70) return 'Yellow'
  if (h < 165) return 'Green'
  if (h < 200) return 'Teal'
  if (h < 255) return 'Blue'
  if (h < 290) return 'Purple'
  if (h < 330) return 'Pink'
  return 'Custom Color'
}

const getColorDisplayName = (rawColor) => {
  if (!rawColor) return ''
  if (typeof rawColor === 'string') {
    const extractedHex = extractHexFromString(rawColor)
    if (extractedHex) {
      const hex = extractedHex
      return HEX_NAME_MAP[hex] || familyFromHex(hex) || 'Custom Color'
    }
    return rawColor.replace(/\s+[0-9a-fA-F]{3,6}$/, '').trim()
  }
  const name = rawColor.name || ''
  const hex = normalizeHex(rawColor.hex || '') || (isHexLike(name) ? normalizeHex(name) : '')
  if (hex) return HEX_NAME_MAP[hex] || familyFromHex(hex) || 'Custom Color'
  if (name && !name.startsWith('#') && !isHexLike(name)) {
    return name.replace(/\s+[0-9a-fA-F]{3,6}$/, '').trim()
  }
  return 'Custom Color'
}

const getContrastYIQ = (hex) => {
  if (!hex) return '#ffffff';
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
}

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const user = useAppSelector(state => state.auth.user)

  const { data, isLoading, refetch } = useGetProductQuery(id)
  const product = data?.product

  const {
    data: reviewsData,
    refetch: refetchReviews,
    isLoading: isReviewsLoading,
    isError: isReviewsError,
    error: reviewsError
  } = useGetReviewsQuery(id)

  React.useEffect(() => {
    const timer = setInterval(() => { refetch() }, 3000)
    return () => clearInterval(timer)
  }, [refetch])

  React.useEffect(() => {
    const prev = document.body.style.overflowX
    document.body.style.overflowX = 'hidden'
    return () => {
      document.body.style.overflowX = prev
    }
  }, [])

  const reviews = reviewsData?.reviews || []

  const { data: wishlistData } = useGetWishlistQuery()
  const wishlistItems = wishlistData?.wishlist || []
  const [toggleWishlist] = useToggleWishlistMutation()

  /* ================= STATE ================= */
  const [mainImage, setMainImage] = React.useState('')
  const [purchaseMode, setPurchaseMode] = React.useState('base') // 'base' or 'variant'
  const [selectedVariantIndex, setSelectedVariantIndex] = React.useState(-1)
  const [selectedBaseSize, setSelectedBaseSize] = React.useState('')
  const [selectedColorKey, setSelectedColorKey] = React.useState('')
  const [selectedSize, setSelectedSize] = React.useState('')
  const [quantity, setQuantity] = React.useState(1)
  const [isAdding, setIsAdding] = React.useState(false)

  const variants = product?.variants || []
  const selectedVariant = selectedVariantIndex >= 0 ? variants[selectedVariantIndex] : null

  // ---- Clothing type & sizes ----
  const clothingType = product?.clothingType || null
  const isClothingProduct = !!clothingType

  // Main product sizes (from product.sizes or tags fallback)
  const BASE_SIZE_TAG_PREFIX = '__base_sizes:'
  const parseBaseSizesFromTags = (rawTags = []) => {
    const marker = (rawTags || []).find(t => typeof t === 'string' && t.startsWith(BASE_SIZE_TAG_PREFIX))
    if (!marker) return []
    return marker.slice(BASE_SIZE_TAG_PREFIX.length).split('|').map(s => s.trim()).filter(Boolean)
  }
  const mainSizes = Array.isArray(product?.sizes) && product.sizes.length > 0
    ? product.sizes
    : parseBaseSizesFromTags(product?.tags || [])

  // Robust Category Detection
  const categoryName = product?.category?.name?.toLowerCase() || (typeof product?.category === 'string' ? product.category.toLowerCase() : '')

  const isElectronics =
    categoryName.includes('electronic') ||
    categoryName.includes('gadget') ||
    categoryName.includes('phone') ||
    categoryName.includes('laptop') ||
    categoryName.includes('computer') ||
    categoryName.includes('tech') ||
    categoryName.includes('appliance') ||
    categoryName.includes('camera') ||
    categoryName.includes('tablet')

  const isGrocery =
    categoryName.includes('groc') ||
    categoryName.includes('food') ||
    categoryName.includes('drink') ||
    categoryName.includes('beverage') ||
    categoryName.includes('snack') ||
    categoryName.includes('provision') ||
    categoryName.includes('supermarket') ||
    categoryName.includes('fruit') ||
    categoryName.includes('veg')

  const sizeLabel = isElectronics
    ? 'Specifications'
    : isGrocery ? 'Size/Weight' : (clothingType ? (CLOTHING_SIZE_LABELS[clothingType] || 'Size') : 'Size')

  // ---- Color meta helpers ----
  const baseColor = product?.color
  const baseColorHex = resolveHex(baseColor)
  const baseColorName = getColorDisplayName(baseColor) || null

  const getColorMeta = (rawColor) => {
    if (!rawColor) return { key: 'no-color', name: '', hex: null }

    // Handle standard legacy string colors
    if (typeof rawColor === 'string') {
      const isHex = rawColor.startsWith('#')
      return {
        key: rawColor,
        name: getColorDisplayName(rawColor),
        hex: isHex ? rawColor : null
      }
    }

    // Handle populated DB objects
    const key = rawColor._id || rawColor.name || 'color'
    const name = getColorDisplayName(rawColor)
    return { key, name, hex: rawColor.hex || null }
  }

  // ---- Variant color options (deduplicated) ----
  const variantColorOptions = React.useMemo(() => {
    const map = new Map()
    variants.forEach(v => {
      const meta = getColorMeta(v.options?.color)
      if (!map.has(meta.key)) map.set(meta.key, meta)
    })
    return Array.from(map.values())
  }, [variants])

  // ---- Sizes available per color ----
  const variantSizesByColor = React.useMemo(() => {
    const map = new Map()
    variants.forEach(v => {
      const meta = getColorMeta(v.options?.color)
      const size = v.options?.size
      if (!map.has(meta.key)) map.set(meta.key, [])
      if (size && !map.get(meta.key).includes(size)) map.get(meta.key).push(size)
    })
    return map
  }, [variants])

  const availableVariantSizes = selectedColorKey && variantSizesByColor.has(selectedColorKey)
    ? variantSizesByColor.get(selectedColorKey)
    : Array.from(new Set(Array.from(variantSizesByColor.values()).flat()))

  // ---- Selected variant color hex (for button styling) ----
  const selectedVariantColorHex = React.useMemo(() => {
    if (selectedColorKey) {
      const meta = variantColorOptions.find(c => c.key === selectedColorKey)
      if (meta?.hex) return meta.hex
    }
    if (selectedVariant) return resolveHex(selectedVariant.options?.color)
    return null
  }, [selectedColorKey, selectedVariant, variantColorOptions])

  /* ================= EFFECTS ================= */
  React.useEffect(() => {
    if (product && !mainImage) {
      setMainImage(product.images?.[0]?.url || '')
    }
  }, [product, mainImage])

  // Sync image with purchaseMode and selectedVariant
  React.useEffect(() => {
    if (purchaseMode === 'base') {
      if (product?.images?.[0]?.url) setMainImage(product.images[0].url)
    } else {
      if (selectedVariant?.image?.url) {
        setMainImage(selectedVariant.image.url)
      } else if (product?.images?.[0]?.url) {
        setMainImage(product.images[0].url)
      }
    }
  }, [purchaseMode, product, selectedVariant])

  // Auto-select first color ONLY if we are in variant mode
  React.useEffect(() => {
    if (purchaseMode === 'variant' && !selectedColorKey && variantColorOptions.length > 0) {
      const firstColor = variantColorOptions[0]
      setSelectedColorKey(firstColor.key)
      const sizes = variantSizesByColor.get(firstColor.key) || []
      if (sizes.length > 0 && !selectedSize) setSelectedSize(sizes[0])
    }
  }, [product, variantColorOptions, purchaseMode])

  // Auto-select first base size
  React.useEffect(() => {
    if (!product) return
    if (mainSizes.length > 0 && !selectedBaseSize) setSelectedBaseSize(mainSizes[0])

    if (variants.length === 0 && purchaseMode !== 'base') {
      setPurchaseMode('base')
    }
  }, [product, mainSizes, variants.length])

  // Sync selectedVariantIndex from color+size
  React.useEffect(() => {
    if (variants.length === 0) return
    if (!selectedColorKey && !selectedSize) return
    const idx = variants.findIndex(v => {
      const meta = getColorMeta(v.options?.color)
      const colorMatch = selectedColorKey ? meta.key === selectedColorKey : true
      const sizeMatch = selectedSize ? (v.options?.size || '') === selectedSize : true
      return colorMatch && sizeMatch
    })
    if (idx >= 0) {
      setSelectedVariantIndex(idx)
      if (variants[idx]?.image?.url) setMainImage(variants[idx].image.url)
    } else {
      const colorIdx = variants.findIndex(v => getColorMeta(v.options?.color).key === selectedColorKey)
      if (colorIdx >= 0 && variants[colorIdx]?.image?.url) setMainImage(variants[colorIdx].image.url)
      setSelectedVariantIndex(-1)
    }
  }, [selectedColorKey, selectedSize, variants])

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse overflow-hidden overflow-x-hidden">
      <div className="flex flex-col lg:flex-row gap-6 overflow-hidden">
        <div className="lg:w-1/2 aspect-[4/5] bg-gray-200 rounded-2xl overflow-hidden" />
        <div className="lg:w-1/2 space-y-4 min-w-0 overflow-hidden">
          <div className="h-10 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
          <div className="h-20 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    </div>
  )
  if (!product) return <p>Product not found</p>

  const isInWishlist = wishlistItems.some(item => {
    const pId = item?.productId?._id || item?.productId || item
    return pId.toString() === product._id.toString()
  })

  const effectiveVariant = purchaseMode === 'variant' ? selectedVariant : null
  const currentStock = effectiveVariant ? effectiveVariant.stock : (product.stock ?? 0)
  const currentPrice = effectiveVariant ? effectiveVariant.price : (product.price ?? 0)
  const currentDiscount = Number(effectiveVariant?.discount ?? product.discount ?? 0)
  const discountedCurrentPrice = currentDiscount > 0
    ? Math.round((currentPrice || 0) * (1 - currentDiscount / 100))
    : (currentPrice || 0)

  const hasVariants = variants.length > 0

  const handleAddToCart = async () => {
    if (purchaseMode === 'variant' && hasVariants) {
      if (!selectedColorKey) {
        toast({ title: 'Please select a color', variant: 'destructive' })
        return
      }
      if (availableVariantSizes.length > 0 && !selectedSize) {
        toast({ title: `Please select a ${sizeLabel.toLowerCase()}`, variant: 'destructive' })
        return
      }
      if (selectedVariantIndex < 0) {
        toast({ title: 'Please select a valid option', variant: 'destructive' })
        return
      }
    } else if (purchaseMode === 'base' || !hasVariants) {
      if (mainSizes.length > 0 && !selectedBaseSize) {
        toast({ title: `Please select a ${sizeLabel.toLowerCase()}`, variant: 'destructive' })
        return
      }
    }

    const displayVariantColorName = (purchaseMode === 'variant' && selectedVariant)
      ? getColorDisplayName(selectedVariant.options?.color)
      : getColorDisplayName(baseColor)
    const displayVariantColorHex = (purchaseMode === 'variant' && selectedVariant)
      ? resolveHex(selectedVariant.options?.color)
      : baseColorHex

    const variantPayload = (purchaseMode === 'variant' && selectedVariant)
      ? {
        _id: selectedVariant._id,
        sku: selectedVariant.sku,
        size: selectedVariant.options?.size || selectedSize || undefined,
        color: selectedVariant.options?.color?._id || selectedVariant.options?.color || undefined
      }
      : (selectedBaseSize ? { size: selectedBaseSize } : null)

    const variantLabel = (purchaseMode === 'variant' && selectedVariant)
      ? [
        displayVariantColorName || '',
        selectedVariant.options?.size || ''
      ].filter(Boolean).join(' / ')
      : [
        displayVariantColorName || '',
        selectedBaseSize || ''
      ].filter(Boolean).join(' / ') || 'Base Product'

    if (!user) {
      dispatch(addGuestCart({
        productId: product._id,
        title: product.title,
        price: discountedCurrentPrice,
        basePrice: currentPrice,
        discount: currentDiscount,
        productImage: mainImage,
        productStock: product.stock ?? 0,
        qty: quantity,
        variant: variantPayload || null,
        variantLabel,
        variantSize: selectedVariant?.options?.size || selectedBaseSize || '',
        variantColorName: displayVariantColorName || '',
        variantColorHex: displayVariantColorHex || '',
        productCategoryName: product?.category?.name || (typeof product?.category === 'string' ? product.category : ''),
        variantStock: selectedVariant?.stock,
        clothingType,
        addedAt: new Date().toISOString(),
        key: `${product._id}-${variantPayload?.sku || variantPayload?.size || selectedBaseSize || 'default'}`
      }))
      toast({ title: 'Added to cart (Guest)' })
      navigate('/cart')
      return
    }

    if (currentStock < quantity) {
      toast({ title: 'Not enough stock', variant: 'destructive' })
      return
    }

    setIsAdding(true)
    try {
      const updatedCart = await cartApi.addToCart(product._id, quantity, variantPayload)
      dispatch(setCart(updatedCart))
      toast({ title: 'Added to Cart' })
      navigate('/cart')
    } catch (err) {
      console.error('Add to cart failed:', err)
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to add to cart',
        variant: 'destructive'
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleWishlistToggle = async () => {
    if (!user) {
      dispatch(toggleGuestWishlist(product._id))
      toast({ title: 'Wishlist updated (Guest)' })
      return
    }
    const result = await toggleWishlist(product._id).unwrap()
    toast({ title: result.message || 'Wishlist updated' })
  }

  const imageList = [
    ...(product.images?.length ? [product.images[0]] : []),
    ...variants.map(v => v.image).filter(img => img && img.url),
    ...(product.images?.slice(1) || [])
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 lg:space-y-8 overflow-x-hidden">
      <div className="flex flex-col lg:flex-row gap-6 xl:gap-8">

        {/* ── IMAGES COLUMN ── */}
        <div className="lg:w-1/2 xl:w-[52%] space-y-4">
          <div className="aspect-[4/5] max-h-[560px] bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm group">
            <img
              src={getImageUrl(mainImage)}
              alt={product.title}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {imageList.map((img, idx) => {
              const url = getImageUrl(img)
              if (!url) return null
              const isActive = getImageUrl(mainImage) === url
              return (
                <div
                  key={idx}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${isActive ? 'border-black' : 'border-transparent hover:border-gray-200'}`}
                  onClick={() => setMainImage(url)}
                >
                  <img src={url} className="w-full h-full object-cover" />
                </div>
              )
            })}
          </div>
        </div>

        {/* ── DETAILS COLUMN ── */}
        <div className="lg:w-1/2 xl:w-[48%] space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              <span>{product.brand?.name || 'ShopLuxe Original'}</span>
              <span>•</span>
              <StarRating rating={product.avgRating} size={14} />
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none">
              {product.title}
            </h1>

            <div className="flex items-center justify-between pt-1">
              <PriceDisplay price={currentPrice} discount={currentDiscount} className="text-4xl" />
              {currentDiscount > 0 && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-red-100 shadow-sm animate-pulse">
                  Sale -{currentDiscount}%
                </div>
              )}
            </div>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed max-w-md relative z-10 text-justify">
            {product.description}
          </p>

          {/* ─── PURCHASE MODE TOGGLE ─── */}
          {hasVariants && (mainSizes.length > 0 || !product.sizes?.length) && (
            <div className="pt-1 relative z-20 bg-transparent">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">
                Purchase Options
              </p>
              <div className="flex bg-slate-100/50 backdrop-blur-sm p-1.5 rounded-2xl w-fit relative border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setPurchaseMode('base')}
                  className={`relative z-10 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${purchaseMode === 'base' ? 'shadow-lg scale-100' : 'text-gray-400 hover:text-gray-600 scale-95 opacity-70'}`}
                  style={purchaseMode === 'base' ? {
                    backgroundColor: baseColorHex || '#000000',
                    color: getContrastYIQ(baseColorHex || '#000000')
                  } : {}}
                >
                  Main Product
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseMode('variant')}
                  className={`relative z-10 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${purchaseMode === 'variant' ? 'bg-white shadow-sm text-black scale-100' : 'text-gray-400 hover:text-gray-600 scale-95 opacity-70'}`}
                >
                  Variants
                </button>
              </div>
            </div>
          )}

          <div className="relative z-10 bg-transparent min-h-[100px] pb-3 px-1 -mx-1 overflow-hidden sm:overflow-visible flex flex-col gap-4">
            {/* ─── VARIANT SELECTOR ─── */}
            {hasVariants && purchaseMode === 'variant' && (
              <div key="variant-selector" className="space-y-4 pt-4 border-t border-slate-100 bg-transparent animate-in fade-in slide-in-from-top-4 duration-300">
                {/* COLOR SELECTOR */}
                {variantColorOptions.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                      Color
                      {selectedColorKey && (
                        <span className="ml-2 text-gray-600 normal-case font-bold">
                          — {variantColorOptions.find(c => c.key === selectedColorKey)?.name || ''}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-3 px-1 pb-1">
                      {variantColorOptions.map(c => {
                        const isSelected = selectedColorKey === c.key
                        return (
                          <button
                            key={`color-${c.key}`}
                            type="button"
                            onClick={() => {
                              setSelectedColorKey(c.key)
                              const sizes = variantSizesByColor.get(c.key) || []
                              setSelectedSize(sizes.length > 0 ? sizes[0] : '')
                            }}
                            title={c.name}
                            className={`w-10 h-10 rounded-full border-[3px] transition-all flex items-center justify-center shadow-md hover:scale-110 active:scale-95 overflow-hidden ${isSelected ? 'scale-110' : 'border-gray-200'}`}
                            style={{
                              backgroundColor: c.hex || '#e5e7eb',
                              borderColor: isSelected ? (c.hex && (c.hex.toLowerCase() === '#ffffff' || c.hex.toLowerCase() === '#fff') ? '#111' : (c.hex || '#111')) : (c.hex && (c.hex.toLowerCase() === '#ffffff' || c.hex.toLowerCase() === '#fff') ? '#d1d5db' : '#e5e7eb'),
                              outline: isSelected ? `3px solid ${c.hex && (c.hex.toLowerCase() === '#ffffff' || c.hex.toLowerCase() === '#fff') ? '#111' : (c.hex || '#111')}` : 'none',
                              outlineOffset: '2px'
                            }}
                          >
                            <span
                              className="text-[8px] font-black uppercase leading-tight text-center px-1 drop-shadow-md z-10"
                              style={{
                                color: c.hex ? getContrastYIQ(c.hex) : '#fff',
                                textShadow: c.hex && getContrastYIQ(c.hex) === '#000000' ? '0 1px 2px rgba(255,255,255,0.8)' : '0 1px 2px rgba(0,0,0,0.8)'
                              }}
                            >
                              {!c.hex && (c.name?.startsWith('#') ? 'EXT' : c.name?.slice(0, 4))}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* SIZE SELECTOR */}
                {availableVariantSizes.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                      {sizeLabel}
                      {selectedSize && (
                        <span className="ml-2 text-gray-600 normal-case font-bold">— {selectedSize}</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableVariantSizes.map(size => {
                        const isSelected = selectedSize === size
                        const activeHex = selectedVariantColorHex || '#111'
                        const variantForStock = variants.find(v => getColorMeta(v.options?.color).key === selectedColorKey && (v.options?.size || '') === size)
                        const stockCount = variantForStock ? (variantForStock.stock ?? 0) : 0
                        const isOOS = stockCount <= 0

                        return (
                          <button
                            key={`vsize-${size}`}
                            type="button"
                            onClick={() => !isOOS && setSelectedSize(size)}
                            disabled={isOOS}
                            className={`relative px-4 py-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center min-w-[70px] ${isOOS ? 'opacity-50 bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400' : 'hover:scale-105 active:scale-95 text-slate-700 bg-white border-gray-200'}`}
                            style={(!isOOS && isSelected)
                              ? { backgroundColor: activeHex, color: getContrastYIQ(activeHex), borderColor: activeHex === '#ffffff' ? '#e5e7eb' : activeHex }
                              : undefined
                            }
                          >
                            <span className={`text-[11px] font-black uppercase tracking-widest ${isOOS ? 'line-through' : ''}`}>{size}</span>
                            {!isOOS && (
                              <span className="text-[8px] mt-0.5 opacity-80 lowercase tracking-wider font-semibold">
                                {stockCount} left
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── MAIN PRODUCT SPECIFICATIONS / SIZES / SELECTION ─── */}
            {(mainSizes.length > 0 || baseColorName) && (purchaseMode === 'base' || !hasVariants) && (
              <div key="main-product-specs" className="space-y-4 pt-4 border-t border-slate-100 bg-transparent animate-in fade-in slide-in-from-top-4 duration-300 mb-3">
                <div className="flex flex-col gap-3">
                  {/* Branded Info Card */}
                  <div className="flex items-center justify-between p-3 bg-slate-50/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 transition-all">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                        {isGrocery ? 'Fresh Stock' : isElectronics ? 'Original Design' : 'Standard Edition'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">
                        {isGrocery ? 'Quality Assured' : isElectronics ? 'Certified Product' : 'Authentic Item'}
                      </span>
                    </div>
                    <div className="px-3 py-1 bg-white/50 border border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-400 tracking-tighter">
                      {isElectronics ? 'Unit Specs' : isGrocery ? 'Size/Weight' : 'Base Unit'}
                    </div>
                  </div>

                  {/* Specification / Size Values */}
                  <div className="space-y-2 px-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {sizeLabel}
                      {purchaseMode === 'base' && selectedBaseSize && (
                        <span className="ml-2 text-slate-700 normal-case font-bold">— {selectedBaseSize}</span>
                      )}
                    </p>
                    {baseColorName && (
                      <div className="flex items-center gap-2 pb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Color</span>
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-600">
                          {baseColorHex && (
                            <span
                              className="inline-block w-3 h-3 rounded-full border border-gray-200"
                              style={{ backgroundColor: baseColorHex }}
                            />
                          )}
                          {baseColorName}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {mainSizes.map(size => {
                        const isSelected = selectedBaseSize === size
                        const activeHex = baseColorHex || '#111'

                        // If we're in variant mode, we show them as badges (read-only) unless no variants exist
                        const isReadOnly = purchaseMode === 'variant' && hasVariants

                        return (
                          <button
                            key={`main-unit-${size}`}
                            type="button"
                            onClick={() => !isReadOnly && setSelectedBaseSize(size)}
                            className={`px-4 py-2 rounded-xl border-2 text-[11px] font-black uppercase tracking-widest transition-all ${isReadOnly ? 'cursor-default opacity-80' : 'hover:scale-105 active:scale-95 cursor-pointer shadow-sm'}`}
                            style={isSelected && !isReadOnly
                              ? { backgroundColor: activeHex, color: getContrastYIQ(activeHex), borderColor: activeHex === '#ffffff' ? '#e5e7eb' : activeHex }
                              : {
                                backgroundColor: isReadOnly ? '#f8fafc' : 'white',
                                color: isReadOnly ? '#64748b' : '#374151',
                                borderColor: isReadOnly ? '#f1f5f9' : '#e5e7eb'
                              }
                            }
                          >
                            {size}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── INVENTORY STATUS ─── */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${currentStock > 0 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {currentStock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                {currentStock > 0 && (
                  <span className="text-[10px] font-black text-slate-900 border-l border-slate-200 pl-4 uppercase tracking-widest">
                    {currentStock} units ready
                  </span>
                )}
              </div>
            </div>

            {/* ─── PURCHASE ACTIONS ─── */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex items-center bg-gray-100 rounded-xl px-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center font-bold hover:text-primary transition-colors disabled:opacity-20"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-black text-sm">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center font-bold hover:text-primary transition-colors disabled:opacity-20"
                    disabled={quantity >= currentStock}
                  >
                    +
                  </button>
                </div>

                <Button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={currentStock < 1 || isAdding}
                  className="flex-1 h-12 bg-black hover:bg-slate-800 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                >
                  {isAdding ? 'Adding...' : (currentStock > 0 ? 'Add to Bag' : 'Sold Out')}
                </Button>

                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all ${isInWishlist ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-gray-100 hover:border-gray-900'}`}
                >
                  <Heart size={20} className={isInWishlist ? 'fill-current' : ''} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── REVIEWS ─── */}
      <div className="pt-8 lg:pt-6 border-t border-gray-100 space-y-8 lg:space-y-6">
        <section>
          <h2 className="text-2xl font-black tracking-tighter uppercase mb-4 lg:mb-3">Customer Reviews</h2>
          {isReviewsLoading ? (
            <div className="grid md:grid-cols-2 gap-12 py-10">
              <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
              <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
          ) : isReviewsError ? (
            <div className="py-8 px-5 rounded-2xl border border-red-100 bg-red-50 text-sm text-red-700 flex items-center justify-between gap-4">
              <span>{reviewsError?.data?.message || 'Failed to load reviews.'}</span>
              <Button variant="outline" className="rounded-xl border-red-200" onClick={refetchReviews}>Retry</Button>
            </div>
          ) : (
            <ReviewSummary
              reviews={reviews}
              avgRating={product.avgRating || 0}
              reviewsCount={product.reviewsCount || 0}
            />
          )}
        </section>

        <section className="grid lg:grid-cols-3 gap-6 xl:gap-8">
          <div className="lg:col-span-2 min-w-0">
            {isReviewsLoading ? (
              <div className="space-y-4">
                <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
                <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
              </div>
            ) : !isReviewsError ? (
              <ReviewList reviews={reviews} productId={product._id} onRefetch={refetchReviews} />
            ) : null}
          </div>
          <div className="bg-gray-50 p-6 lg:p-7 rounded-3xl h-fit lg:sticky lg:top-24">
            <ReviewForm productId={product._id} onSuccess={refetchReviews} user={user} />
          </div>
        </section>
      </div>
    </div>
  )
}
