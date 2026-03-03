import { createSlice } from "@reduxjs/toolkit"

const loadGuestCart = () => {
  try {
    return JSON.parse(localStorage.getItem("guestCart")) || []
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

      const exists = state.items.find(
        i =>
          i.product === item.product &&
          (i.variant || "") === (item.variant || "")
      )

      if (exists) {
        exists.qty += item.qty || 1
      } else {
        state.items.push(item)
      }

      localStorage.setItem(
        "guestCart",
        JSON.stringify(state.items)
      )
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
  clearCart
} = cartSlice.actions

export default cartSlice.reducer