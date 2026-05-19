import { useSelector } from 'react-redux'
import { selectCurrentRole } from '../auth/authSlice'
import DashboardPage from '../dashboard/DashboardPage'
import ClientDashboard from '../dashboard/ClientDashboard'

/**
 * ContulMeu — role-aware renderer.
 *   consultant → ConsultantDashboard (full sidebar: Overview, Sessions, Availability, Profile)
 *   client | admin → ClientDashboard (Sessions + basic profile)
 */
export default function ContulMeu() {
  const role = useSelector(selectCurrentRole)

  if (role === 'consultant') return <DashboardPage />
  return <ClientDashboard />
}
