import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, NavLink, useLocation, Link } from 'react-router-dom'
import { logout, selectCurrentUser, selectCurrentRole } from '../features/auth/authSlice'
import { useLogoutApiMutation } from '../features/auth/authApi'
import { setLanguage, selectLanguage } from '../features/lang/langSlice'
import { useLabels } from '../lib/useLabels'

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [logoutApi] = useLogoutApiMutation()
  const user = useSelector(selectCurrentUser)
  const role = useSelector(selectCurrentRole)
  const lang = useSelector(selectLanguage)
  const t = useLabels()

  async function handleLogout() {
    try {
      await logoutApi().unwrap()
    } catch (err) {
      console.error('Logout API call failed:', err)
    } finally {
      dispatch(logout())
      navigate('/login')
    }
  }

  function toggleLanguage() {
    dispatch(setLanguage(lang === 'ro' ? 'en' : 'ro'))
  }

  const linkStyle = ({ isActive }) => ({
    padding: '6px 12px',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
    background: isActive ? 'var(--blue-bg)' : 'transparent',
  })

  return (
    <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', height: 57 }}>
      <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/acasa" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', borderRadius: 12, overflow: 'hidden' }}>
            <img src="/logo-long.jpg" alt="SERVIO Logo" style={{ height: 32, objectFit: 'contain', borderRadius: 12 }} />
          </Link>
          <div style={{ display: 'flex', gap: 4 }}>
            <NavLink to="/acasa" style={linkStyle}>{t.nav.home}</NavLink>
            {user && (
              <NavLink to="/contul-meu" style={linkStyle}>{t.nav.myAccount}</NavLink>
            )}
            {role === 'admin' && (
              <NavLink to="/tools" style={linkStyle}>{t.nav.tools}</NavLink>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={toggleLanguage}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
              padding: '3px 8px',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            aria-label="Toggle language"
          >
            <span style={{ color: lang === 'ro' ? 'var(--primary)' : 'var(--text-muted)' }}>RO</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span style={{ color: lang === 'en' ? 'var(--primary)' : 'var(--text-muted)' }}>EN</span>
          </button>

          {user ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {user.name ?? user.email}
                <span className="badge badge-grey" style={{ marginLeft: 8 }}>{role}</span>
              </span>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                {t.nav.signOut}
              </button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login', { state: { from: location } })}>
              {t.nav.signIn}
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
