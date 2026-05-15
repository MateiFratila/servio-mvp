import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { selectCurrentRole } from '../features/auth/authSlice'

const ROLE_DEFAULT = {
  client: '/catalogue',
  consultant: '/dashboard',
  admin: '/tools',
}

export default function RoleGuard({ allowed, children }) {
  const role = useSelector(selectCurrentRole)

  if (!allowed.includes(role)) {
    return <Navigate to={ROLE_DEFAULT[role] ?? '/login'} replace />
  }

  return children
}
