import { api } from '../../services/api'

export const dashboardApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMySessionsAsConsultant: build.query({
      query: () => '/sessions',
      providesTags: ['Session'],
    }),
    getMyProfile: build.query({
      query: () => '/consultants/me',
      providesTags: ['User'],
    }),
    updateMyProfile: build.mutation({
      query: (body) => ({ url: '/consultants/me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
    uploadAvatar: build.mutation({
      query: (formData) => ({ url: '/consultants/me/avatar', method: 'POST', body: formData }),
      invalidatesTags: ['User'],
    }),
    uploadBanner: build.mutation({
      query: (formData) => ({ url: '/consultants/me/banner', method: 'POST', body: formData }),
      invalidatesTags: ['User'],
    }),
    getExpertiseCategories: build.query({
      query: () => '/consultants/categories',
      providesTags: ['Category'],
    }),
    getSpecialisations: build.query({
      query: () => '/consultants/specialisations',
      providesTags: ['Specialisation'],
    }),
    getMySlots: build.query({
      query: () => '/consultants/me/slots',
      providesTags: ['Slot'],
    }),
    updateMySlots: build.mutation({
      query: (body) => ({ url: '/consultants/me/slots', method: 'PUT', body }),
      invalidatesTags: ['Slot', 'User'],
    }),
    updateSessionStatus: build.mutation({
      query: ({ id, ...body }) => ({ url: `/sessions/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Session'],
    }),
    updateAccountSettings: build.mutation({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
    deleteMyAccount: build.mutation({
      query: () => ({ url: '/users/me', method: 'DELETE' }),
    }),
    getConnectStatus: build.query({
      query: () => '/consultants/me/connect/status',
      providesTags: ['ConnectStatus'],
    }),
    startConnectOnboarding: build.mutation({
      query: () => ({ url: '/consultants/me/connect/onboard', method: 'POST' }),
      invalidatesTags: ['ConnectStatus'],
    }),
    suggestSpecialisation: build.mutation({
      query: (body) => ({ url: '/consultants/suggest-specialisation', method: 'POST', body }),
    }),
    suggestExpertiseArea: build.mutation({
      query: (body) => ({ url: '/consultants/suggest-expertise-area', method: 'POST', body }),
    }),
    getMyReviews: build.query({
      query: () => '/consultants/me/reviews',
      providesTags: ['Review'],
    }),
    requestPublication: build.mutation({
      query: () => ({ url: '/consultants/me/request-publication', method: 'POST' }),
      invalidatesTags: ['User'],
    }),
  }),
})

export const {
  useGetMySessionsAsConsultantQuery,
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useUploadAvatarMutation,
  useUploadBannerMutation,
  useGetExpertiseCategoriesQuery,
  useGetSpecialisationsQuery,
  useGetMySlotsQuery,
  useUpdateMySlotsMutation,
  useUpdateSessionStatusMutation,
  useUpdateAccountSettingsMutation,
  useDeleteMyAccountMutation,
  useGetConnectStatusQuery,
  useStartConnectOnboardingMutation,
  useSuggestSpecialisationMutation,
  useSuggestExpertiseAreaMutation,
  useGetMyReviewsQuery,
  useRequestPublicationMutation,
} = dashboardApi
