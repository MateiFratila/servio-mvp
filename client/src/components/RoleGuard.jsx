import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { selectCurrentRole } from '../features/auth/authSlice'

export default function RoleGuard({ allowed, children }) {
  const role = useSelector(selectCurrentRole)

  if (!allowed.includes(role)) {
    return <Navigate to="/acasa" replace />
  }

  return children
}
