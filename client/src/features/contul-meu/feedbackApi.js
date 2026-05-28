import { api } from '../../services/api'

export const feedbackApi = api.injectEndpoints({
  endpoints: (build) => ({
    submitFeedback: build.mutation({
      query: (body) => ({
        url: '/feedbacks',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Feedback'],
    }),
  }),
})

export const { useSubmitFeedbackMutation } = feedbackApi
