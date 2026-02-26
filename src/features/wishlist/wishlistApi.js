import { api } from '@/app/api'

export const wishlistApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ Fetch wishlist
    getWishlist: builder.query({
      query: () => ({
        url: '/wishlist',
        credentials: 'include'   // ✅ REQUIRED
      }),
      providesTags: ['Wishlist']
    }),

    // ✅ Toggle wishlist
    toggleWishlist: builder.mutation({
      query: (productId) => ({
        url: '/wishlist/toggle',
        method: 'POST',
        body: { productId },     // ✅ correct payload
        credentials: 'include'   // ✅ REQUIRED
      }),
      invalidatesTags: ['Wishlist']
    })
  })
})

export const {
  useGetWishlistQuery,
  useToggleWishlistMutation
} = wishlistApi
