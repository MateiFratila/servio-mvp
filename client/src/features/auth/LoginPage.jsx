import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setCredentials } from './authSlice'

const ROLE_DEFAULTS = {
  client: { id: 1, email: 'client@servio.io', name: 'Lorem Client', role: 'client' },
  consultant: { id: 2, email: 'consultant@servio.io', name: 'Lorem Ipsum', role: 'consultant' },
  admin: { id: 3, email: 'admin@servio.io', name: 'Admin User', role: 'admin' },
}

const ROLE_REDIRECT = {
  client: '/catalogue',
  consultant: '/dashboard',
  admin: '/tools',
}

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('client')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    // TODO: replace with real POST /api/auth/login
    const user = { ...ROLE_DEFAULTS[role], email }
    dispatch(setCredentials({ user, token: 'mock-jwt-token' }))
    navigate(ROLE_REDIRECT[role])
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Servio</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Sign in to your account</p>
        </div>

        {error && (
          <div className="badge badge-red" style={{ display: 'block', marginBottom: 16, padding: '8px 12px', borderRadius: 'var(--radius)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role (dev only)</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="client">Client</option>
              <option value="consultant">Consultant</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
