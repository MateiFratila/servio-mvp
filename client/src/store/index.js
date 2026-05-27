import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import langReducer from '../features/lang/langSlice'
import { api } from '../services/api'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    lang: langReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
})
