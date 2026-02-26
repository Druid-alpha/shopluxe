import { createSlice } from '@reduxjs/toolkit'
import { wishlistApi } from './wishlistApi'

const initialState = {
  items: []
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlist: (state) => {
      state.items = []
    }
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        wishlistApi.endpoints.getWishlist.matchFulfilled,
        (state, { payload }) => {
          state.items = payload.wishlist || []
        }
      )
  }
})

export const { clearWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
