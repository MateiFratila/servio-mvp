import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  token: null,
  isInitialized: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isInitialized = true
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isInitialized = true
    },
    setInitialized: (state) => {
      state.isInitialized = true
    },
  },
})

export const { setCredentials, logout, setInitialized } = authSlice.actions
export default authSlice.reducer

export const selectCurrentUser = (state) => state.auth.user
export const selectCurrentToken = (state) => state.auth.token
export const selectCurrentRole = (state) => state.auth.user?.role ?? null
export const selectIsInitialized = (state) => state.auth.isInitialized
