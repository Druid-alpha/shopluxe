import { api } from "@/app/api"

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({

    /* ================= PUBLIC ================= */

    getProducts: builder.query({
      query: ({
        page = 1,
        limit = 12,
        search,
        category,
        brand,
        color,
        clothingType,
        minPrice,
        maxPrice,
        availability,
        sortBy,
      } = {}) => {
        const values = typeof availability === "string"
          ? availability.split(",").map((v) => v.trim()).filter(Boolean)
          : []
        const inStock =
          values.length === 1
            ? values[0] === "in_stock"
              ? true
              : values[0] === "out_of_stock"
                ? false
                : undefined
            : undefined

        return {
        url: "/products",
        params: {
          page,
          limit,
          search,
          category,
          brand,
          color,
          clothingType,
          minPrice,
          maxPrice,
          availability,
          inStock,
          sortBy,
        },
      }
      },
      providesTags: ["Product"],
    }),

    getFeaturedProducts: builder.query({
      query: () => ({
        url: "/products/featured",
        params: { limit: 12 },
      }),
      providesTags: ["Product"],
    }),

    getProduct: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [
        { type: "Product", id },

      ],
    }),

    /* ================= REVIEWS ================= */

    getReviews: builder.query({
      query: (productId) => `/reviews/product/${productId}`,
      providesTags: (result, error, productId) => [
        { type: "Review", id: productId },
      ],
    }),

    addReview: builder.mutation({
      query: ({ productId, rating, comment }) => ({
        url: `/reviews/${productId}`,
        method: "POST",
        body: { rating, body: comment },
        credentials: "include",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Review", id: arg.productId },
        { type: "Product", id: arg.productId },
      ],
    }),

    updateReview: builder.mutation({
      query: ({ reviewId, rating, comment }) => ({
        url: `/reviews/${reviewId}`,
        method: "PUT",
        body: { rating, body: comment },
        credentials: "include",
      }),
      invalidatesTags: ["Review"],
    }),

    deleteReview: builder.mutation({
      query: (reviewId) => ({
        url: `/reviews/${reviewId}`,
        method: "DELETE",
        credentials: "include",
      }),
      invalidatesTags: ["Review"],
    }),

    toggleHelpful: builder.mutation({
      query: (reviewId) => ({
        url: `/reviews/${reviewId}/helpful`,
        method: "POST",
      }),
      invalidatesTags: ["Review"],
    }),

    getAdminReviews: builder.query({
      query: (page = 1) => ({
        url: "/reviews/admin/all",
        params: { page },
        credentials: "include",
      }),
      providesTags: ["Review"],
    }),

    getFeaturedReviews: builder.query({
      query: () => ({
        url: "/reviews/featured",
      }),
      providesTags: ["Review"],
      keepUnusedDataFor: 300,
    }),

    toggleFeaturedReview: builder.mutation({
      query: (reviewId) => ({
        url: `/reviews/admin/${reviewId}/feature`,
        method: "PATCH",
        credentials: "include",
      }),
      invalidatesTags: ["Review"],
    }),

    /* ================= ADMIN ================= */

    getAdminProducts: builder.query({
      async queryFn(
        {
          page = 1,
          limit = 10,
          search,
          category,
          brand,
          color,
          clothingType = null,
          minPrice,
          maxPrice,
          availability,
          sortBy,
        } = {},
        _api,
        _extraOptions,
        baseQuery
      ) {
        const params = {
          page,
          limit,
          search,
          category,
          brand,
          color,
          clothingType: clothingType === "all" ? null : clothingType,
          minPrice,
          maxPrice,
          availability,
          sortBy,
        }

        const primary = await baseQuery({
          url: "/admin/products",
          params,
          credentials: "include",
        })
        if (!primary.error) return { data: primary.data }

        const fallback = await baseQuery({
          url: "/products/admin",
          params,
          credentials: "include",
        })
        if (!fallback.error) return { data: fallback.data }

        return { error: primary.error || fallback.error }
      },
      providesTags: ["Product"],
    }),


    createProduct: builder.mutation({
      query: (formData) => ({
        url: "/products/admin",
        method: "POST",
        body: formData, // FormData (images + payload)
        credentials: "include",
      }),
      invalidatesTags: ["Product"],
    }),

    updateProduct: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/products/admin/${id}`,
        method: "PUT",
        body: formData,
        credentials: "include",
      }),
      invalidatesTags: ["Product"],
    }),

    updateProductVariants: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/products/admin/${id}/variants`,
        method: "PUT",
        body: formData,
        credentials: "include",
      }),
      invalidatesTags: ["Product"],
    }),
    toggleFeatured: builder.mutation({
      query: ({ id, featured }) => ({
        url: `/products/admin/${id}/feature`,
        method: "PATCH",
        body: { featured },
        credentials: "include",
      }),
      invalidatesTags: ["Product"],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/admin/${id}`,
        method: "DELETE",
        credentials: "include",
      }),
      invalidatesTags: ["Product"],
    }),

    restoreProduct: builder.mutation({
      query: (id) => ({
        url: `/products/admin/${id}/restore`,
        method: "PATCH",
        credentials: "include",
      }),
      invalidatesTags: ["Product"],
    }),

    restoreAllProducts: builder.mutation({
      query: () => ({
        url: "/products/admin/restore-all",
        method: "PATCH",
        credentials: "include",
      }),
      invalidatesTags: ["Product"],
    }),

    hardDeleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/admin/${id}/hard`,
        method: "DELETE",
        credentials: "include",
      }),
      invalidatesTags: ["Product"],
    }),

    hardDeleteAllProducts: builder.mutation({
      query: () => ({
        url: "/products/admin/hard-delete-all",
        method: "DELETE",
        credentials: "include",
      }),
      invalidatesTags: ["Product"],
    }),

  }),
})

/* ================= EXPORT HOOKS ================= */

export const {
  // PUBLIC
  useGetProductsQuery,
  useGetFeaturedProductsQuery,
  useGetProductQuery,

  // REVIEWS
  useGetReviewsQuery,
  useAddReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useToggleHelpfulMutation,
  useGetAdminReviewsQuery,
  useGetFeaturedReviewsQuery,

  // ADMIN
  useGetAdminProductsQuery,
  useToggleFeaturedMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUpdateProductVariantsMutation,
  useDeleteProductMutation,
  useRestoreProductMutation,
  useRestoreAllProductsMutation,
  useHardDeleteProductMutation,
  useHardDeleteAllProductsMutation,
  useToggleFeaturedReviewMutation,
} = productApi
