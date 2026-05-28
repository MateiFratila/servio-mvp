import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useRefreshMutation } from './features/auth/authApi'
import { setCredentials, setInitialized } from './features/auth/authSlice'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthGuard from './components/AuthGuard'
import RoleGuard from './components/RoleGuard'
import Navbar from './components/Navbar'
import LoginPage from './features/auth/LoginPage'
import AcasaPage from './features/acasa/AcasaPage'
import ContulMeuPage from './features/contul-meu/ContulMeuPage'
import CataloguePage from './features/catalogue/CataloguePage'
import ConsultantDetail from './features/catalogue/ConsultantDetail'
import ToolsPage from './features/tools/ToolsPage'
import MeetingPage from './features/meeting/MeetingPage'
import SessionDetailPage from './features/meeting/SessionDetailPage'
import ConsultantLandingPage from './features/consultant/ConsultantLandingPage'
import ConsultantRegisterPage from './features/consultant/ConsultantRegisterPage'
import ClientLandingPage from './features/landing/ClientLandingPage'
import ClientRegisterPage from './features/landing/ClientRegisterPage'

function RootRedirect() {
  return <Navigate to="/acasa" replace />
}

function PublicLayout({ children }) {
  return (
    <div className="page">
      <Navbar />
      {children}
    </div>
  )
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
  const dispatch = useDispatch()
  const [refresh] = useRefreshMutation()
  const [isRefreshing, setIsRefreshing] = useState(true)

  useEffect(() => {
    let active = true
    const checkRefresh = async () => {
      try {
        const payload = await refresh().unwrap()
        if (active) {
          dispatch(setCredentials(payload))
        }
      } catch (err) {
        if (active) {
          dispatch(setInitialized())
        }
      } finally {
        if (active) {
          setIsRefreshing(false)
        }
      }
    }
    checkRefresh()
    return () => {
      active = false
    }
  }, [refresh, dispatch])

  if (isRefreshing) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p>Se încarcă...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/acasa"
          element={
            <PublicLayout>
              <AcasaPage />
            </PublicLayout>
          }
        />

        <Route
          path="/contul-meu"
          element={
            <ProtectedLayout>
              <RoleGuard allowed={['client', 'consultant', 'admin']}>
                <ContulMeuPage />
              </RoleGuard>
            </ProtectedLayout>
          }
        />

        <Route
          path="/catalog"
          element={
            <PublicLayout>
              <CataloguePage />
            </PublicLayout>
          }
        />

        <Route
          path="/catalog/:id"
          element={
            <PublicLayout>
              <ConsultantDetail />
            </PublicLayout>
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

        <Route
          path="/client"
          element={
            <PublicLayout>
              <ClientLandingPage />
            </PublicLayout>
          }
        />

        <Route
          path="/client/inregistrare"
          element={
            <PublicLayout>
              <ClientRegisterPage />
            </PublicLayout>
          }
        />

        <Route
          path="/consultant"
          element={
            <PublicLayout>
              <ConsultantLandingPage />
            </PublicLayout>
          }
        />

        <Route
          path="/consultant/inregistrare"
          element={
            <PublicLayout>
              <ConsultantRegisterPage />
            </PublicLayout>
          }
        />

        <Route path="/" element={<AuthGuard><RootRedirect /></AuthGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

