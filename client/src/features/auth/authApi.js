import { api } from '../../services/api'

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: build.mutation({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),
    registerConsultant: build.mutation({
      query: (data) => ({
        url: '/auth/register/consultant',
        method: 'POST',
        body: data,
      }),
    }),
    refresh: build.mutation({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),
    logoutApi: build.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useRegisterConsultantMutation,
  useRefreshMutation,
  useLogoutApiMutation,
} = authApi
