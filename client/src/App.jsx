import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectCurrentRole } from './features/auth/authSlice'
import AuthGuard from './components/AuthGuard'
import RoleGuard from './components/RoleGuard'
import Navbar from './components/Navbar'
import LoginPage from './features/auth/LoginPage'
import AcasaPage from './features/acasa/AcasaPage'
import ConsultantDetail from './features/catalogue/ConsultantDetail'
import ToolsPage from './features/tools/ToolsPage'
import MeetingPage from './features/meeting/MeetingPage'
import SessionDetailPage from './features/meeting/SessionDetailPage'

function RootRedirect() {
  const role = useSelector(selectCurrentRole)
  if (role) return <Navigate to="/acasa" replace />
  return <Navigate to="/login" replace />
}

function ProtectedLayout({ children }) {
  return (
    <AuthGuard>
      <div className="page">
        <Navbar />
        {children}
      </div>
    </AuthGuard>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/acasa"
          element={
            <ProtectedLayout>
              <RoleGuard allowed={['client', 'consultant', 'admin']}>
                <AcasaPage />
              </RoleGuard>
            </ProtectedLayout>
          }
        />

        <Route
          path="/catalog/:id"
          element={
            <ProtectedLayout>
              <RoleGuard allowed={['client', 'consultant', 'admin']}>
                <ConsultantDetail />
              </RoleGuard>
            </ProtectedLayout>
          }
        />

        <Route
          path="/tools"
          element={
            <ProtectedLayout>
              <RoleGuard allowed={['admin']}>
                <ToolsPage />
              </RoleGuard>
            </ProtectedLayout>
          }
        />

        <Route
          path="/sessions/:sessionId"
          element={
            <ProtectedLayout>
              <RoleGuard allowed={['client', 'consultant', 'admin']}>
                <SessionDetailPage />
              </RoleGuard>
            </ProtectedLayout>
          }
        />

        <Route
          path="/meeting/:sessionId"
          element={
            <AuthGuard>
              <MeetingPage />
            </AuthGuard>
          }
        />

        <Route path="/" element={<AuthGuard><RootRedirect /></AuthGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

