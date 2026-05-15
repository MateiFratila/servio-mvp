import { api } from '../../services/api'

export const dashboardApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMySessionsAsConsultant: build.query({
      query: () => '/sessions',
      providesTags: ['Session'],
    }),
    getMyProfile: build.query({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
    updateMyProfile: build.mutation({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
    getMySlots: build.query({
      query: () => '/consultants/me/slots',
      providesTags: ['Slot'],
    }),
    updateMySlots: build.mutation({
      query: (body) => ({ url: '/consultants/me/slots', method: 'PUT', body }),
      invalidatesTags: ['Slot'],
    }),
    updateSessionStatus: build.mutation({
      query: ({ id, ...body }) => ({ url: `/sessions/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Session'],
    }),
  }),
})

export const {
  useGetMySessionsAsConsultantQuery,
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useGetMySlotsQuery,
  useUpdateMySlotsMutation,
  useUpdateSessionStatusMutation,
} = dashboardApi
