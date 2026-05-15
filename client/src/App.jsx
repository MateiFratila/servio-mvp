import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectCurrentRole } from './features/auth/authSlice'
import AuthGuard from './components/AuthGuard'
import RoleGuard from './components/RoleGuard'
import Navbar from './components/Navbar'
import LoginPage from './features/auth/LoginPage'
import CataloguePage from './features/catalogue/CataloguePage'
import ConsultantDetail from './features/catalogue/ConsultantDetail'
import DashboardPage from './features/dashboard/DashboardPage'
import ToolsPage from './features/tools/ToolsPage'

function RootRedirect() {
  const role = useSelector(selectCurrentRole)
  if (role === 'client') return <Navigate to="/catalogue" replace />
  if (role === 'consultant') return <Navigate to="/dashboard" replace />
  if (role === 'admin') return <Navigate to="/tools" replace />
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
          path="/catalogue"
          element={
            <ProtectedLayout>
              <RoleGuard allowed={['client', 'admin']}>
                <CataloguePage />
              </RoleGuard>
            </ProtectedLayout>
          }
        />
        <Route
          path="/catalogue/:id"
          element={
            <ProtectedLayout>
              <RoleGuard allowed={['client', 'admin']}>
                <ConsultantDetail />
              </RoleGuard>
            </ProtectedLayout>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <RoleGuard allowed={['consultant', 'admin']}>
                <DashboardPage />
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

        <Route path="/" element={<AuthGuard><RootRedirect /></AuthGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

