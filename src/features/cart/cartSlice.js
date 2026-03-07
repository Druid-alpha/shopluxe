import { createSlice } from "@reduxjs/toolkit"

const sortNewestFirst = (items = []) =>
  [...items].sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0))

const persistGuestCart = (items) => {
  localStorage.setItem("guestCart", JSON.stringify(items))
}

const loadGuestCart = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("guestCart")) || []
    const normalized = saved.map((item) => ({
      ...item,
      key: item.key || `${item.productId}-${item.variant || "default"}`,
      addedAt: item.addedAt || new Date().toISOString(),
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
      state.items = action.payload
    },

    addGuestCart: (state, action) => {
      const item = action.payload
      const addedAt = item.addedAt || new Date().toISOString()

      const exists = state.items.find(
        i =>
          i.productId === item.productId &&
          (i.variant || "") === (item.variant || "")
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
  removeGuestCartItem,
  clearCart
} = cartSlice.actions

export default cartSlice.reducer
