import { createSlice } from '@reduxjs/toolkit'
import { wishlistApi } from './wishlistApi'

const loadGuestWishlist = () => {
  try {
    return JSON.parse(localStorage.getItem("guestWishlist")) || []
  } catch {
    return []
  }
}

const initialState = {
  items: loadGuestWishlist()
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {

    toggleGuestWishlist: (state, action) => {
      const productId = action.payload

      const exists = state.items.includes(productId)

      state.items = exists
        ? state.items.filter(id => id !== productId)
        : [...state.items, productId]

      localStorage.setItem(
        "guestWishlist",
        JSON.stringify(state.items)
      )
    },

    clearWishlist: (state) => {
      state.items = []
      localStorage.removeItem("guestWishlist")
    }
  },

  extraReducers: (builder) => {
    builder.addMatcher(
      wishlistApi.endpoints.getWishlist.matchFulfilled,
      (state, { payload }) => {
        state.items = payload.wishlist || []
      }
    )
  }
})

export const {
  toggleGuestWishlist,
  clearWishlist
} = wishlistSlice.actions

export default wishlistSlice.reducer