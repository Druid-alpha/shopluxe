import { createSlice } from "@reduxjs/toolkit"

const sortNewestFirst = (items = []) =>
  [...items].sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0))

const getVariantKey = (variant) => {
  if (!variant) return "default"
  if (typeof variant === "string") return variant || "default"
  if (variant?.sku) return variant.sku
  const size = variant?.size || ""
  const color = variant?.color || ""
  const combined = `${color}|${size}`.trim()
  return combined === "|" ? "default" : combined
}

const persistGuestCart = (items) => {
  localStorage.setItem("guestCart", JSON.stringify(items))
}

const loadGuestCart = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("guestCart")) || []
    const seedTime = Date.now()
    const normalized = saved.map((item, index) => ({
      ...item,
      key: item.key || `${item.productId}-${getVariantKey(item.variant)}`,
      addedAt: item.addedAt || new Date(seedTime + index).toISOString(),
    }))
    return sortNewestFirst(normalized)
  } catch {
    return []
  }
}

const initialState = {
  items: loadGuestCart()
}

const cartSlice = createSlice({
  name: "cart",
  initialState,

  reducers: {

    setCart: (state, action) => {
      state.items = sortNewestFirst(action.payload || [])
    },

    addGuestCart: (state, action) => {
      const item = action.payload
      const addedAt = item.addedAt || new Date().toISOString()

      const exists = state.items.find(i =>
        i.productId === item.productId &&
        getVariantKey(i.variant) === getVariantKey(item.variant)
      )

      if (exists) {
        exists.qty += item.qty || 1
        exists.addedAt = addedAt
      } else {
        state.items.push({ ...item, addedAt })
      }

      state.items = sortNewestFirst(state.items)
      persistGuestCart(state.items)
    },

    updateGuestCartQty: (state, action) => {
      const { key, qty } = action.payload
      state.items = state.items.map((item) =>
        item.key === key ? { ...item, qty: Math.max(1, Number(qty) || 1) } : item
      )
      persistGuestCart(state.items)
    },

    updateGuestCartVariant: (state, action) => {
      const { key, nextVariant, nextMeta } = action.payload
      const existing = state.items.find((item) => item.key === key)
      if (!existing) return

      const newKey = `${existing.productId}-${getVariantKey(nextVariant)}`
      const already = state.items.find((item) => item.key === newKey)

      if (already && already.key !== key) {
        already.qty += existing.qty
        state.items = state.items.filter((item) => item.key !== key)
      } else {
        state.items = state.items.map((item) =>
          item.key === key
            ? {
              ...item,
              key: newKey,
              variant: nextVariant?.sku || nextVariant || null,
              variantPayload: nextVariant || null,
              variantSize: nextMeta?.size || '',
              variantColorName: nextMeta?.colorName || '',
              variantColorHex: nextMeta?.colorHex || null,
              productImage: nextMeta?.imageUrl || item.baseProductImage || item.productImage,
              price: Number(nextMeta?.finalPrice ?? item.price),
              basePrice: Number(nextMeta?.basePrice ?? item.basePrice),
              discount: Number(nextMeta?.discount ?? item.discount)
            }
            : item
        )
      }

      state.items = sortNewestFirst(state.items)
      persistGuestCart(state.items)
    },

    removeGuestCartItem: (state, action) => {
      const key = action.payload
      state.items = state.items.filter((item) => item.key !== key)
      persistGuestCart(state.items)
    },

    clearCart: (state) => {
      state.items = []
      localStorage.removeItem("guestCart")
    }
  }
})

export const {
  setCart,
  addGuestCart,
  updateGuestCartQty,
  updateGuestCartVariant,
  removeGuestCartItem,
  clearCart
} = cartSlice.actions

export default cartSlice.reducer
