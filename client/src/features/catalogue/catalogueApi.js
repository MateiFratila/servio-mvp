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
    getSpecialisations: build.query({
      query: () => '/consultants/specialisations',
      providesTags: ['Specialisation'],
    }),
    getConsultant: build.query({
      query: (id) => `/consultants/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Consultant', id }],
    }),
    getConsultantSlots: build.query({
      query: ({ consultantId, date, duration = 1 }) =>
        `/consultants/${consultantId}/slots?date=${date}&duration=${duration}`,
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
    getSessionDocuments: build.query({
      query: (sessionId) => `/sessions/${sessionId}/documents`,
      providesTags: (_res, _err, sessionId) => [{ type: 'SessionDocument', id: sessionId }],
    }),
    uploadDocument: build.mutation({
      query: ({ sessionId, file }) => {
        const body = new FormData()
        body.append('file', file)
        return { url: `/sessions/${sessionId}/documents`, method: 'POST', body }
      },
      invalidatesTags: (_res, _err, { sessionId }) => [{ type: 'SessionDocument', id: sessionId }],
    }),
    deleteDocument: build.mutation({
      query: ({ sessionId, docId }) => ({
        url: `/sessions/${sessionId}/documents/${docId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { sessionId }) => [{ type: 'SessionDocument', id: sessionId }],
    }),
    getSessionMessages: build.query({
      query: (sessionId) => `/sessions/${sessionId}/messages`,
      providesTags: (_res, _err, sessionId) => [{ type: 'SessionMessage', id: sessionId }],
    }),
    contactClient: build.mutation({
      query: ({ sessionId, content, file }) => {
        const body = new FormData()
        body.append('content', content)
        if (file) body.append('file', file)
        return { url: `/sessions/${sessionId}/messages`, method: 'POST', body }
      },
      invalidatesTags: (_res, _err, { sessionId }) => [
        { type: 'Session', id: sessionId },
        { type: 'SessionMessage', id: sessionId },
      ],
    }),
    submitReview: build.mutation({
      query: ({ sessionId, rating, testimonial, privateNotes }) => ({
        url: `/sessions/${sessionId}/reviews`,
        method: 'POST',
        body: { rating, testimonial, privateNotes },
      }),
      invalidatesTags: (_res, _err, { sessionId }) => [
        { type: 'Session', id: sessionId },
        'Consultant',
      ],
    }),
  }),
})

export const {
  useGetConsultantsQuery,
  useGetSpecialisationsQuery,
  useGetConsultantQuery,
  useGetConsultantSlotsQuery,
  useGetMySessionsAsClientQuery,
  useGetSessionQuery,
  useGetMeetingTokenQuery,
  useCreatePaymentIntentMutation,
  useBookSessionMutation,
  useCancelSessionMutation,
  useGetSessionDocumentsQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  useGetSessionMessagesQuery,
  useContactClientMutation,
  useSubmitReviewMutation,
} = catalogueApi
