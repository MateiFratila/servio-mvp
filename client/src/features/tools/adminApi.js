import { api } from '../../services/api'

export const adminApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAdminStats: build.query({
      query: () => '/admin/stats',
      providesTags: ['User', 'Session', 'Consultant'],
    }),
  }),
})

export const { useGetAdminStatsQuery } = adminApi
