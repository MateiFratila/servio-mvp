import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { selectCurrentToken, selectIsInitialized } from '../features/auth/authSlice'

export default function AuthGuard({ children }) {
  const token = useSelector(selectCurrentToken)
  const isInitialized = useSelector(selectIsInitialized)
  const location = useLocation()

  if (!isInitialized) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p>Se încarcă...</p>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
