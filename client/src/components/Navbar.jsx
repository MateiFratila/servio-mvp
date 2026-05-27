import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, NavLink } from 'react-router-dom'
import { logout, selectCurrentUser, selectCurrentRole } from '../features/auth/authSlice'

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)
  const role = useSelector(selectCurrentRole)

  function handleLogout() {
    dispatch(logout())
    navigate('/login')
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
          <span style={{ fontWeight: 700, fontSize: 16 }}>Servio</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <NavLink to="/acasa" style={linkStyle}>Acasă</NavLink>
            {user && (
              <NavLink to="/contul-meu" style={linkStyle}>Contul meu</NavLink>
            )}
            {role === 'admin' && (
              <NavLink to="/tools" style={linkStyle}>Tools</NavLink>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {user.name ?? user.email}
                <span className="badge badge-grey" style={{ marginLeft: 8 }}>{role}</span>
              </span>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
