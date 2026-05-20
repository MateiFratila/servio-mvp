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
    getSession: build.query({
      query: (id) => `/sessions/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Session', id }],
    }),
    getMeetingToken: build.query({
      query: (sessionId) => `/sessions/${sessionId}/meeting-token`,
    }),
    createPaymentIntent: build.mutation({
      query: (body) => ({ url: '/payments/create-intent', method: 'POST', body }),
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
  useGetSessionQuery,
  useGetMeetingTokenQuery,
  useCreatePaymentIntentMutation,
  useBookSessionMutation,
  useCancelSessionMutation,
} = catalogueApi
