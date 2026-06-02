import { useGetMyReviewsQuery, useGetMyProfileQuery } from './dashboardApi'
import ReviewsTable from '../../components/ReviewsTable'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../auth/authSlice'

export default function ReviewsTab() {
  const currentUser = useSelector(selectCurrentUser)
  const { data: reviews = [], isLoading } = useGetMyReviewsQuery()
  const { data: profile } = useGetMyProfileQuery()

  return (
    <div className="card">
      <h3 className="section-title" style={{ marginBottom: 20 }}>Recenziile mele</h3>
      <ReviewsTable
        reviews={reviews}
        isLoading={isLoading}
        consultantUserId={currentUser?.id}
        consultantDisplayName={profile?.displayName}
      />
    </div>
  )
}
