import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { selectCurrentToken } from '../features/auth/authSlice'

export default function AuthGuard({ children }) {
  const token = useSelector(selectCurrentToken)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
