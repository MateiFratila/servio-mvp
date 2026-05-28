import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { setCredentials, logout } from '../features/auth/authSlice'

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

const baseQueryWithReauth = async (args, apiInstance, extraOptions) => {
  let result = await baseQuery(args, apiInstance, extraOptions)

  if (result.error && result.error.status === 401) {
    const isRefreshPath = typeof args === 'string' 
      ? args.includes('/auth/refresh') 
      : args?.url?.includes('/auth/refresh')

    if (!isRefreshPath) {
      // Attempt to get a new accessToken using the refreshToken cookie
      const refreshResult = await baseQuery({ url: '/auth/refresh', method: 'POST' }, apiInstance, extraOptions)
      if (refreshResult.data) {
        apiInstance.dispatch(setCredentials(refreshResult.data))
        // Retry the original query
        result = await baseQuery(args, apiInstance, extraOptions)
      } else {
        apiInstance.dispatch(logout())
      }
    }
  }
  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Consultant', 'Session', 'User', 'Slot', 'SessionDocument', 'Category', 'Specialisation'],
  endpoints: () => ({}),
})
