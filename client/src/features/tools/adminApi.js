import { api } from '../../services/api'

export const adminApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAdminStats: build.query({
      query: () => '/admin/stats',
      providesTags: ['User', 'Session', 'Consultant'],
    }),
    getFeedbacks: build.query({
      query: () => '/admin/feedbacks',
      providesTags: ['Feedback'],
    }),
    getPrivateReviews: build.query({
      query: ({ page = 1, limit = 30 } = {}) => `/admin/private-reviews?page=${page}&limit=${limit}`,
      providesTags: ['Session'],
    }),
    deleteFeedback: build.mutation({
      query: (id) => ({
        url: `/admin/feedbacks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Feedback'],
    }),
  }),
})

export const { useGetAdminStatsQuery, useGetFeedbacksQuery, useGetPrivateReviewsQuery, useDeleteFeedbackMutation } = adminApi
