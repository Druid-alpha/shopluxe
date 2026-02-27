import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { logout, setUser } from '@/features/auth/authSlice'

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

const baseQueryWithRefresh = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result?.error?.status === 401) {
    // Try refresh
    const refreshToken = api.getState().auth.refreshToken
    if (!refreshToken) {
      api.dispatch(logout())
      return result
    }

    const refreshResult = await baseQuery(
      { url: '/auth/refresh', method: 'POST', body: { token: refreshToken } },
      api,
      extraOptions
    )

    if (refreshResult?.data?.user && refreshResult?.data?.accessToken) {
      api.dispatch(
        setUser({
          user: refreshResult.data.user,
          accessToken: refreshResult.data.accessToken,
          refreshToken, // keep old refresh token
        })
      )
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