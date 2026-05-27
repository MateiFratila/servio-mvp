import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setCredentials } from './authSlice'
import { useLoginMutation } from './authApi'
import { useLabels } from '../../lib/useLabels'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [login, { isLoading }] = useLoginMutation()
  const t = useLabels()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) {
      setError(t.login.errorRequired)
      return
    }
    try {
      const result = await login({ email, password }).unwrap()
      dispatch(setCredentials({ user: result.user, token: result.token }))
      navigate('/acasa', { replace: true })
    } catch (err) {
      setError(err?.data?.error ?? t.login.errorFailed)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Servio</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{t.login.tagline}</p>
        </div>

        {error && (
          <div className="badge badge-red" style={{ display: 'block', marginBottom: 16, padding: '8px 12px', borderRadius: 'var(--radius)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label htmlFor="email">{t.login.emailLabel}</label>
            <input
              id="email"
              type="email"
              placeholder={t.login.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t.login.passwordLabel}</label>
            <input
              id="password"
              type="password"
              placeholder={t.login.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }} disabled={isLoading}>
            {isLoading ? t.login.signingIn : t.login.signIn}
          </button>
        </form>
      </div>
    </div>
  )
}
