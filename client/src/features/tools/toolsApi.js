import { api } from '../../services/api'

export const toolsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAllConsultants: build.query({
      query: () => '/admin/consultants',
      providesTags: ['Consultant'],
    }),
    updateConsultant: build.mutation({
      query: ({ id, ...body }) => ({ url: `/consultants/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Consultant'],
    }),
    changeConsultantEmail: build.mutation({
      query: ({ id, email }) => ({
        url: `/admin/consultants/${id}/change-email`,
        method: 'POST',
        body: { email },
      }),
      invalidatesTags: ['Consultant'],
    }),
    resendConsultantActivation: build.mutation({
      query: (id) => ({
        url: `/admin/consultants/${id}/resend-activation`,
        method: 'POST',
      }),
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
    updateUserByAdmin: build.mutation({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
    getSystemSettings: build.query({
      query: () => '/admin/settings',
      providesTags: ['SystemSettings'],
    }),
    updateSystemSetting: build.mutation({
      query: ({ key, value }) => ({ url: `/admin/settings/${key}`, method: 'PATCH', body: { value } }),
      invalidatesTags: ['SystemSettings'],
    }),
    getPublicLegalDocument: build.query({
      query: (key) => `/public-settings/legal/${key}`,
    }),
    getSuggestions: build.query({
      query: () => '/admin/suggestions',
      providesTags: ['Suggestions'],
    }),
    approveSpecialisationSuggestion: build.mutation({
      query: (id) => ({ url: `/admin/suggestions/specialisations/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['Suggestions', 'Specialisation'],
    }),
    rejectSpecialisationSuggestion: build.mutation({
      query: (id) => ({ url: `/admin/suggestions/specialisations/${id}/reject`, method: 'POST' }),
      invalidatesTags: ['Suggestions'],
    }),
    approveExpertiseAreaSuggestion: build.mutation({
      query: (id) => ({ url: `/admin/suggestions/expertise-areas/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['Suggestions', 'Specialisation'],
    }),
    rejectExpertiseAreaSuggestion: build.mutation({
      query: (id) => ({ url: `/admin/suggestions/expertise-areas/${id}/reject`, method: 'POST' }),
      invalidatesTags: ['Suggestions'],
    }),
  }),
})

export const {
  useGetAllConsultantsQuery,
  useUpdateConsultantMutation,
  useChangeConsultantEmailMutation,
  useResendConsultantActivationMutation,
  useGetAllSessionsQuery,
  useForceDeleteSessionMutation,
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  useUpdateUserByAdminMutation,
  useGetSystemSettingsQuery,
  useUpdateSystemSettingMutation,
  useGetPublicLegalDocumentQuery,
  useGetSuggestionsQuery,
  useApproveSpecialisationSuggestionMutation,
  useRejectSpecialisationSuggestionMutation,
  useApproveExpertiseAreaSuggestionMutation,
  useRejectExpertiseAreaSuggestionMutation,
} = toolsApi
