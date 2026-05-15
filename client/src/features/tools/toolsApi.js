import { api } from '../../services/api'

export const toolsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAllConsultants: build.query({
      query: () => '/consultants',
      providesTags: ['Consultant'],
    }),
    updateConsultant: build.mutation({
      query: ({ id, ...body }) => ({ url: `/consultants/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Consultant'],
    }),
    getAllSessions: build.query({
      query: (params = {}) => ({ url: '/sessions', params }),
      providesTags: ['Session'],
    }),
    forceDeleteSession: build.mutation({
      query: (id) => ({ url: `/sessions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Session'],
    }),
    getAllUsers: build.query({
      query: () => '/users',
      providesTags: ['User'],
    }),
    updateUserRole: build.mutation({
      query: ({ id, role }) => ({ url: `/users/${id}`, method: 'PATCH', body: { role } }),
      invalidatesTags: ['User'],
    }),
  }),
})

export const {
  useGetAllConsultantsQuery,
  useUpdateConsultantMutation,
  useGetAllSessionsQuery,
  useForceDeleteSessionMutation,
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
} = toolsApi
