import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { logout, setUser } from '@/features/auth/authSlice'

// Base query (cookies included)
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: 'include', // ✅ sends accessToken via cookie
})

// Refresh-aware query
const baseQueryWithRefresh = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result?.error?.status === 401) {
    const refreshResult = await baseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions
    )

    if (refreshResult?.data?.user) {
      api.dispatch(setUser(refreshResult.data.user))
      result = await baseQuery(args, api, extraOptions)
    } else {
      api.dispatch(logout())
    }
  }

  return result
}


export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['Auth', 'Product', 'Cart', 'Wishlist', 'Order', 'Review'],
  endpoints: () => ({}),
})
