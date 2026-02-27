import { createSlice } from '@reduxjs/toolkit'
import { api } from '@/app/api'

const getStoredAuth = () => {
  try {
    const stored = localStorage.getItem('auth')
    if (!stored || stored === 'undefined') return null
    return JSON.parse(stored)
  } catch {
    return null
  }
}

const initialState = getStoredAuth() || {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      // payload = { user, accessToken, refreshToken }
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      localStorage.setItem('auth', JSON.stringify(state))
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      localStorage.removeItem('auth')
    },
  },
})

export const { setUser, logout } = authSlice.actions

export const logoutAndReset = () => (dispatch) => {
  dispatch(logout())
  dispatch(api.util.resetApiState())
}

export default authSlice.reducer