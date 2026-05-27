import { useSelector } from 'react-redux'
import { selectCurrentRole } from '../auth/authSlice'
import DashboardPage from '../dashboard/DashboardPage'
import ClientDashboard from '../dashboard/ClientDashboard'

export default function ContulMeuPage() {
  const role = useSelector(selectCurrentRole)
  if (role === 'consultant') return <DashboardPage />
  return <ClientDashboard />
}
