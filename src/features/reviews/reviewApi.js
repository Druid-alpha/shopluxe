import { api } from '@/app/api'

export const reviewApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReviews: builder.query({
      query: (productId) => `/reviews/product/${productId}`,
      providesTags: (r, e, productId) => [
        { type: 'Review', id: productId },
      ],
    }),

    addReview: builder.mutation({
      query: ({ productId, rating, title, body }) => ({
        url: `/reviews/${productId}`,
        method: 'POST',
        body: { rating, title, body },
        credentials: 'include',
      }),
      invalidatesTags: (r, e, { productId }) => [
        { type: 'Review', id: productId },
        { type: 'Product', id: productId }, // ⭐ updates ProductCard
      ],
    }),

    updateReview: builder.mutation({
      query: ({ reviewId, rating, title, body }) => ({
        url: `/reviews/${reviewId}`,
        method: 'PUT',
        body: { rating, title, body },
        credentials: 'include',
      }),
      invalidatesTags: ['Review', 'Product'],
    }),

    deleteReview: builder.mutation({
      query: (reviewId) => ({
        url: `/reviews/${reviewId}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: ['Review', 'Product'],
    }),
  }),
})

export const {
  useGetReviewsQuery,
  useAddReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} = reviewApi
