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
    deleteFeedback: build.mutation({
      query: (id) => ({
        url: `/admin/feedbacks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Feedback'],
    }),
  }),
})

export const { useGetAdminStatsQuery, useGetFeedbacksQuery, useDeleteFeedbackMutation } = adminApi
