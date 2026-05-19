import { api } from '../../services/api'

export const catalogueApi = api.injectEndpoints({
  endpoints: (build) => ({
    getConsultants: build.query({
      query: (params = {}) => ({
        url: '/consultants',
        params,
      }),
      providesTags: ['Consultant'],
    }),
    getConsultant: build.query({
      query: (id) => `/consultants/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Consultant', id }],
    }),
    getConsultantSlots: build.query({
      query: ({ consultantId, date }) => `/consultants/${consultantId}/slots?date=${date}`,
      providesTags: ['Slot'],
    }),
    getMySessionsAsClient: build.query({
      query: () => '/sessions',
      providesTags: ['Session'],
    }),
    bookSession: build.mutation({
      query: (body) => ({ url: '/sessions', method: 'POST', body }),
      invalidatesTags: ['Session', 'Slot'],
    }),
    cancelSession: build.mutation({
      query: (id) => ({ url: `/sessions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Session', 'Slot'],
    }),
  }),
})

export const {
  useGetConsultantsQuery,
  useGetConsultantQuery,
  useGetConsultantSlotsQuery,
  useGetMySessionsAsClientQuery,
  useBookSessionMutation,
  useCancelSessionMutation,
} = catalogueApi
