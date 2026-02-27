import { createSlice } from '@reduxjs/toolkit'
import { api } from '@/app/api'

const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('user')
    if (!stored || stored === 'undefined') return null
    return JSON.parse(stored)
  } catch {
    return null
  }
}

const initialState = {
  user: getStoredUser(), // MUST be the user object, not { user: {...} }
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
      localStorage.setItem('user', JSON.stringify(action.payload))
    },
    logout: (state) => {
      state.user = null
      localStorage.removeItem('user')
    },
  },
})

export const { setUser, logout } = authSlice.actions

export const logoutAndReset = () => (dispatch) => {
  dispatch(logout())
  dispatch(api.util.resetApiState())
}

export default authSlice.reducer
