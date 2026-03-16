// src/pages/Cart.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { removeGuestCartItem, setCart, updateGuestCartQty, updateGuestCartVariant } from '@/features/cart/cartSlice';
import * as cartApi from '@/features/cart/cartApi';
import { Trash, Loader2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { clearReservationStorage, cancelAllReservations, getStoredReservation } from '@/lib/reservation';
import { productApi } from '@/features/products/productApi';

const CLOTHING_TYPES = new Set(['clothes', 'shoes', 'bags', 'eyeglass'])
const SIZE_TYPE_LABEL = {
  clothes: 'Size',
  shoes: 'Shoe',
  bags: 'Size',
  eyeglass: 'Frame'
}

function VariantBadges({ item }) {
  const clothingTypeKey = item.clothingType === 'bag' ? 'bags' : item.clothingType
  const isClothing = CLOTHING_TYPES.has(clothingTypeKey)
  const categoryName = String(item.productCategoryName || '').toLowerCase()
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
  const colorHex = item.variantColorHex || null
  const labelColor = item.variantLabel?.split(' / ')?.[0] || ''
  let colorName = item.variantColorName
    || item.productColorName
    || (!/^(size|spec|weight|size\/weight)\b/i.test(labelColor) ? labelColor : '')

  // Robust size extraction
  const rawSize = item.variantSize || item.variantLabel?.split(' / ')?.[1] || ''
  const sizeTypeLabel = isClothing
    ? (SIZE_TYPE_LABEL[clothingTypeKey] || 'Size')
    : (isGrocery ? 'Size/Weight' : (isElectronics ? 'Spec' : 'Size'))

  // Clean up size if it already contains the prefix or category name
  const cleanSize = String(rawSize)
    .replace(/^(Size|Spec|Size\/Weight):?\s*/i, '')
    .replace(new RegExp(`^${sizeTypeLabel}:?\\s*`, 'i'), '')
    .trim()
  const isDuplicate = cleanSize.toLowerCase().includes(sizeTypeLabel.toLowerCase())
  const reservedCount = Number(item.productTotalReserved ?? item.productReserved ?? 0)
  const totalCount = Number(item.productTotalStock ?? item.productStock ?? 0)
  const availableCount = Math.max(0, totalCount - reservedCount)
  const isReservedHigh = totalCount > 0
    && reservedCount >= Math.ceil(totalCount * 0.7)
    && availableCount < 5

  if (!colorName && !cleanSize && !item.variantLabel) return null

  if (!colorName && colorHex) {
    colorName = 'Color'
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-1">
      {colorName && (
        <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
          {colorHex && (
            <span
              className="inline-block w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
              style={{ backgroundColor: colorHex }}
            />
          )}
          {colorName}
        </span>
      )}
      {cleanSize && (
        <span className="bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
          {isDuplicate ? cleanSize : `${sizeTypeLabel}: ${cleanSize}`}
        </span>
      )}
      {reservedCount > 0 && (
        <span className="bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-700">
          Reserved {reservedCount} - Avail {availableCount}
        </span>
      )}
      {isReservedHigh && (
        <span className="bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-rose-700">
          High Reserved
        </span>
      )}
      {!colorName && !cleanSize && item.variantLabel && (
        <span className="bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
          {item.variantLabel}
        </span>
      )}
    </div>
  )
}

function VariantEditor({ item, onChange, disabled }) {
  const variants = Array.isArray(item.productVariants) ? item.productVariants : []
  if (variants.length === 0) return null

  const colorKeyForVariant = (v) => (v.colorHex || v.colorName || '').toLowerCase()
  const colorOptions = []
  const colorSeen = new Set()
  variants.forEach(v => {
    const key = colorKeyForVariant(v)
    if (!key) return
    if (colorSeen.has(key)) return
    colorSeen.add(key)
    colorOptions.push({ key, name: v.colorName || 'Color', hex: v.colorHex || null })
  })

  const initialColorKey = (item.variantColorHex || item.variantColorName || '').toLowerCase()
  const [colorKey, setColorKey] = useState(initialColorKey || colorOptions[0]?.key || '')
  const [size, setSize] = useState(item.variantSize || '')
  const hasBaseOption = Number(item.productStock || 0) > 0

  const sizesByColor = new Map()
  variants.forEach(v => {
    const key = colorKeyForVariant(v)
    if (!key) return
    if (!sizesByColor.has(key)) sizesByColor.set(key, [])
    if (v.size && !sizesByColor.get(key).includes(v.size)) sizesByColor.get(key).push(v.size)
  })

  const availableSizes = sizesByColor.get(colorKey) || []

  const resolveVariant = () => {
    const match = variants.find(v => {
      const key = colorKeyForVariant(v)
      const sizeMatch = size ? v.size === size : true
      return key === colorKey && sizeMatch
    })
    if (match) return match
    return variants.find(v => colorKeyForVariant(v) === colorKey) || variants[0]
  }

  useEffect(() => {
    if (availableSizes.length > 0 && !availableSizes.includes(size)) {
      setSize(availableSizes[0])
    }
  }, [colorKey])

  const applyChange = (nextColorKey, nextSize) => {
    const nextVariant = variants.find(v => {
      const key = colorKeyForVariant(v)
      const sizeMatch = nextSize ? v.size === nextSize : true
      return key === nextColorKey && sizeMatch
    })
    if (nextVariant) onChange(nextVariant)
  }

  return (
    <div className="flex flex-col gap-2 pt-2">
      {hasBaseOption && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setColorKey('')
              setSize('')
              onChange(null)
            }}
            className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${!item.variant ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-black'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Main Product
          </button>
        </div>
      )}
      {colorOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {colorOptions.map((c) => {
            const isSelected = colorKey === c.key
            const borderColor = c.hex || '#e5e7eb'
            return (
              <button
                key={c.key}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setColorKey(c.key)
                  const nextSize = (sizesByColor.get(c.key) || [])[0] || ''
                  setSize(nextSize)
                  applyChange(c.key, nextSize)
                }}
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'scale-110' : 'hover:scale-105'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ borderColor: isSelected ? (c.hex || '#111') : borderColor, backgroundColor: c.hex || '#f1f5f9' }}
                title={c.name}
              >
                <span className="text-[8px] font-black uppercase text-white mix-blend-difference">
                  {!c.hex ? (c.name || '').slice(0, 2) : ''}
                </span>
              </button>
            )
          })}
        </div>
      )}
      {availableSizes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((s) => {
            const isSelected = size === s
            return (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setSize(s)
                  applyChange(colorKey, s)
                }}
                className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${isSelected ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-black'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {s}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Cart() {
  const cart = useAppSelector(state => state.cart.items);
  const user = useAppSelector(state => state.auth.user)
  const token = useAppSelector(state => state.auth.token)
  const sortedCart = [...cart].sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0))

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [updatingItems, setUpdatingItems] = useState({})
  const [isLoadingCart, setIsLoadingCart] = useState(false)
  const [reservationExpiresAt, setReservationExpiresAt] = useState(null)
  const [reservationRemaining, setReservationRemaining] = useState(null)
  const [isReleasing, setIsReleasing] = useState(false)

  /* ================= LOAD CART ================= */
  useEffect(() => {
    if (!user) return
    const fetchCart = async () => {
      try {
        setIsLoadingCart(true)
        const data = await cartApi.getCart();
        dispatch(setCart(data));
      } catch (err) {
        console.error('Failed to fetch cart:', err);
      } finally {
        setIsLoadingCart(false)
      }
    };
    fetchCart();
  }, [dispatch, user]);

  useEffect(() => {
    if (!user) return
    const handleReservationRefresh = async () => {
      try {
        const data = await cartApi.getCart()
        dispatch(setCart(data))
      } catch {
        // ignore refresh errors
      }
    }
    window.addEventListener('shopluxe:reservation-updated', handleReservationRefresh)
    return () => window.removeEventListener('shopluxe:reservation-updated', handleReservationRefresh)
  }, [dispatch, user])

  useEffect(() => {
    const raw = window.localStorage.getItem('shopluxe_reservation')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      const expiresAt = Number(parsed?.expiresAt || 0)
      if (!expiresAt || Number.isNaN(expiresAt)) {
        clearReservationStorage()
        return
      }
      if (expiresAt <= Date.now()) {
        clearReservationStorage()
        return
      }
      setReservationExpiresAt(expiresAt)
    } catch {
      clearReservationStorage()
    }
  }, [token])

  useEffect(() => {
    if (!user || reservationExpiresAt) return
    const syncReservation = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/orders/pending-reservation`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        })
        const data = await res.json()
        if (!res.ok) return
        if (!data?.reservation?.expiresAt || !data?.reservation?.orderId) return
        const expiresAtMs = new Date(data.reservation.expiresAt).getTime()
        if (Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) return
        window.localStorage.setItem('shopluxe_reservation', JSON.stringify({
          orderId: data.reservation.orderId,
          expiresAt: expiresAtMs
        }))
        setReservationExpiresAt(expiresAtMs)
      } catch {
        // ignore sync errors
      }
    }
    void syncReservation()
  }, [reservationExpiresAt, token, user])

  useEffect(() => {
    if (!reservationExpiresAt) return
    const tick = () => {
      const remainingMs = reservationExpiresAt - Date.now()
      if (remainingMs <= 0) {
        setReservationRemaining(null)
        setReservationExpiresAt(null)
        void cancelAllReservations({ token })
        clearReservationStorage()
        return
      }
      setReservationRemaining(remainingMs)
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [reservationExpiresAt, token])

  const formatRemaining = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    if (minutes <= 0) return `${seconds}s`
    return `${minutes}m ${seconds}s`
  }

  const handleCancelReservation = async () => {
    if (isReleasing) return
    setIsReleasing(true)
    try {
      await cancelAllReservations({ token })
      clearReservationStorage()
      setReservationExpiresAt(null)
      setReservationRemaining(null)
      try {
        const refreshed = await cartApi.getCart()
        dispatch(setCart(refreshed))
      } catch {
        // ignore cart refresh errors
      }
      dispatch(productApi.util.invalidateTags(['Product']))
      toast({ title: 'Reservation cleared' })
    } catch {
      toast({
        title: 'Could not clear reservation',
        description: 'Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsReleasing(false)
    }
  }


  if (isLoadingCart) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black" />
      </div>
    )
  }

  if (!cart.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 p-12 text-center bg-gradient-to-br from-white via-slate-50 to-amber-50 rounded-2xl border border-gray-100">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-2 border-dashed border-gray-200 shadow-sm">
          <ShoppingCart className="text-gray-300" size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tighter uppercase">Your bag is empty</h2>
          <p className="text-gray-400 text-sm font-medium">Add some items to start your collection.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="bg-black text-white hover:bg-slate-800 rounded-none px-12 py-7 text-xs font-black uppercase tracking-widest"
            onClick={() => navigate('/')}
          >
            Return to Collections
          </Button>
        </div>
      </div>
    );
  }

  const total = sortedCart.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);

  /* ================= CHANGE QUANTITY ================= */
  const changeQty = async (item, delta) => {
    if (updatingItems[item.key]) return
    const currentQty = Number(item.qty);
    const stockValue = item.variantStock ?? item.productStock
    const availableStock = Number.isFinite(stockValue) ? Number(stockValue) : Number.POSITIVE_INFINITY
    const newQty = currentQty + Number(delta);

    if (newQty < 1) return;
    if (newQty > availableStock) {
      toast({ title: 'Reached maximum stock limit', variant: 'destructive' });
      return;
    }

    setUpdatingItems(prev => ({ ...prev, [item.key]: true }))
    if (!user) {
      dispatch(updateGuestCartQty({ key: item.key, qty: newQty }))
      setUpdatingItems(prev => ({ ...prev, [item.key]: false }))
      return
    }

    const optimisticCart = cart.map(cartItem =>
      cartItem.key === item.key ? { ...cartItem, qty: newQty } : cartItem
    )
    dispatch(setCart(optimisticCart))

    try {
      const variantArg = (item.variantPayload && Object.keys(item.variantPayload).length > 0)
        ? item.variantPayload
        : (item.variant || null)
      const data = await cartApi.updateCartItem(item.productId, newQty, variantArg);
      dispatch(setCart(data));
    } catch (err) {
      console.error('Failed to update item:', err);
      dispatch(setCart(cart));
      toast({
        title: 'Failed to update cart',
        description: err.response?.data?.message || 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setUpdatingItems(prev => ({ ...prev, [item.key]: false }))
    }
  };

  /* ================= REMOVE ITEM ================= */
  const removeItem = async (item) => {
    if (!user) {
      dispatch(removeGuestCartItem(item.key))
      return
    }
    try {
      const variantArg = (item.variantPayload && Object.keys(item.variantPayload).length > 0)
        ? item.variantPayload
        : (item.variant || null)
      const data = await cartApi.removeCartItem(item.productId, variantArg);
      dispatch(setCart(data));
    } catch (err) {
      console.error('Failed to remove item:', err);
      toast({
        title: 'Failed to remove item',
        description: err.response?.data?.message || 'Please try again',
        variant: 'destructive'
      });
    }
  };

  const changeVariant = async (item, nextVariant) => {
    const isBaseSelection = !nextVariant
    if (isBaseSelection && !item.variant && !item.variantPayload) return
    const updatingKey = `${item.key}-variant`
    if (updatingItems[updatingKey]) return
    setUpdatingItems(prev => ({ ...prev, [updatingKey]: true }))

    const nextMeta = isBaseSelection
      ? {
        size: '',
        colorName: '',
        colorHex: null,
        imageUrl: item.baseProductImage || item.productImage || null,
        basePrice: Number(item.basePrice ?? 0),
        discount: Number(item.discount ?? 0)
      }
      : {
        size: nextVariant.size || '',
        colorName: nextVariant.colorName || '',
        colorHex: nextVariant.colorHex || null,
        imageUrl: nextVariant.imageUrl || null,
        basePrice: Number(nextVariant.price ?? item.basePrice ?? 0),
        discount: Number(nextVariant.discount ?? item.discount ?? 0)
      }
    const finalPrice = nextMeta.discount > 0
      ? Math.round(nextMeta.basePrice * (1 - nextMeta.discount / 100))
      : nextMeta.basePrice
    nextMeta.finalPrice = finalPrice

    if (!user) {
      dispatch(updateGuestCartVariant({
        key: item.key,
        nextVariant: isBaseSelection
          ? null
          : {
              _id: nextVariant._id,
              sku: nextVariant.sku,
              size: nextVariant.size,
              color: nextVariant.colorName
            },
        nextMeta
      }))
      setUpdatingItems(prev => ({ ...prev, [updatingKey]: false }))
      return
    }

    try {
      const oldVariantArg = (item.variantPayload && Object.keys(item.variantPayload).length > 0)
        ? item.variantPayload
        : (item.variant || null)
      if (isBaseSelection) {
        // Remove variant first, then add base item.
        await cartApi.removeCartItem(item.productId, oldVariantArg)
        const data = await cartApi.addToCart(item.productId, item.qty, null)
        dispatch(setCart(data))
      } else {
        const nextPayload = nextVariant?._id
          ? { _id: nextVariant._id, sku: nextVariant.sku }
          : { sku: nextVariant.sku }
        await cartApi.addToCart(item.productId, item.qty, nextPayload)
        const data = await cartApi.removeCartItem(item.productId, oldVariantArg)
        dispatch(setCart(data))
      }
      toast({ title: 'Variant updated' })
    } catch (err) {
      toast({
        title: 'Failed to update variant',
        description: err.response?.data?.message || 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setUpdatingItems(prev => ({ ...prev, [updatingKey]: false }))
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight font-display">Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="lg:w-2/3 space-y-12">
          <div className="space-y-8">
            {sortedCart.map(item => {
              const stockValue = item.variantStock ?? item.productStock
              const hasKnownStock = Number.isFinite(stockValue)
              const maxStock = hasKnownStock ? Number(stockValue) : Number.POSITIVE_INFINITY

              return (
                <div
                  key={item.key}
                  className="flex flex-col sm:flex-row items-center sm:items-start gap-8 group"
                >
                  {/* Product Image */}
                  <div className="w-full sm:w-40 aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 p-4 transition-all group-hover:shadow-md">
                    <img
                      src={item.productImage || 'https://via.placeholder.com/150'}
                      alt={item.title}
                      className="w-full h-full object-contain transition-transform group-hover:scale-105 duration-500"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 w-full space-y-4 pt-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-black text-lg text-slate-900 tracking-tight uppercase leading-tight">{item.title}</h3>
                        <VariantBadges item={item} />
                        <VariantEditor
                          item={item}
                          disabled={updatingItems[`${item.key}-variant`]}
                          onChange={(nextVariant) => changeVariant(item, nextVariant)}
                        />
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg text-slate-900">
                          ₦{((item.price || 0) * (item.qty || 1)).toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold text-gray-300 tracking-widest uppercase">₦{(item.price || 0).toLocaleString()} /ea</p>
                      </div>
                    </div>

                    {/* Quantity & Remove */}
                    <div className="flex items-center justify-between pt-6">
                      <div className="flex items-center bg-gray-50 rounded-xl px-2 border border-gray-100">
                        <button
                          className="w-10 h-10 flex items-center justify-center font-bold text-gray-400 hover:text-black transition disabled:opacity-20"
                          onClick={() => changeQty(item, -1)}
                          disabled={updatingItems[item.key] || item.qty <= 1}
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-xs font-black tracking-widest">
                          {updatingItems[item.key] ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : item.qty}
                        </span>
                        <button
                          className="w-10 h-10 flex items-center justify-center font-bold text-gray-400 hover:text-black transition disabled:opacity-20"
                          onClick={() => changeQty(item, 1)}
                          disabled={updatingItems[item.key] || item.qty >= maxStock}
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 flex items-center gap-2 px-4 py-2 rounded-full hover:bg-red-50 transition-all active:scale-95"
                        onClick={() => removeItem(item)}
                      >
                        <Trash size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-gray-50 rounded-xl p-6 md:p-8 space-y-6 sticky top-24 border border-gray-200/60 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-4">Order Summary</h2>

            <div className="space-y-4 text-sm">
              {(() => {
                const productMap = new Map()
                sortedCart.forEach(item => {
                  const productId = item.productId || item.product?._id || item.product
                  if (!productId || productMap.has(productId)) return
                  const stock = Number(item.productTotalStock ?? item.productStock ?? 0)
                  const reserved = Number(item.productTotalReserved ?? item.productReserved ?? 0)
                  productMap.set(productId, { stock, reserved })
                })
                const totals = Array.from(productMap.values())
                const totalAvailable = totals.reduce((sum, p) => sum + Math.max(0, p.stock - p.reserved), 0)
                const totalReserved = totals.reduce((sum, p) => sum + p.reserved, 0)
                if (totalAvailable + totalReserved <= 0) return null
                const pct = Math.min(100, Math.max(0, (totalAvailable / Math.max(1, totalAvailable + totalReserved)) * 100))
                return (
                  <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-amber-700">
                    <div className="flex items-center justify-between">
                      <span>{totalAvailable} available</span>
                      <span>{totalReserved} reserved</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-amber-100">
                      <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })()}
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({sortedCart.length} item{sortedCart.length !== 1 ? 's' : ''})</span>
                <span className="font-medium text-gray-900">₦{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping estimate</span>
                <span className="font-medium text-gray-900">Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-gray-600 pb-4 border-b border-gray-200">
                <span>Tax</span>
                <span className="font-medium text-gray-900">₦0</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>

            {reservationRemaining && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 mt-4">
                Reservation expires in {formatRemaining(reservationRemaining)}
              </div>
            )}
            {reservationRemaining && (
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 mt-3"
                onClick={handleCancelReservation}
                disabled={isReleasing}
              >
                {isReleasing ? 'Clearing...' : 'Cancel Reservation'}
              </Button>
            )}
            <Button
              className="w-full text-lg h-14 bg-black hover:bg-gray-800 text-white shadow-md transition-all rounded-lg mt-4"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </Button>

            <div className="mt-4 bg-white rounded-xl border border-gray-200 px-4 py-3 text-[10px] uppercase tracking-widest font-black text-gray-500 flex items-center justify-between">
              <span>Secure Paystack</span>
              <span className="text-gray-300">-</span>
              <span>SSL Protected</span>
              <span className="text-gray-300">-</span>
              <span>No card stored</span>
            </div>

            <div className="text-center mt-6">
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-500 hover:text-black font-medium transition-colors"
              >
                Continue Shopping &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
