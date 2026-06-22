import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { setCredentials } from './authSlice'
import { useLoginMutation, useForgotPasswordMutation } from './authApi'
import { useLabels } from '../../lib/useLabels'
import ClientRegisterForm from './ClientRegisterForm'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [login, { isLoading }] = useLoginMutation()
  const [sendResetEmail, { isLoading: isSendingForgot }] = useForgotPasswordMutation()
  const t = useLabels()

  const [isRegistering, setIsRegistering] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')
  const [forgotError, setForgotError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) {
      setError(t.login.errorRequired)
      return
    }
    try {
      const result = await login({ email, password }).unwrap()
      dispatch(setCredentials({ user: result.user, token: result.token }))
      
      const from = location.state?.from || '/acasa'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err?.data?.error ?? t.login.errorFailed)
    }
  }

  async function handleForgotSubmit(e) {
    e.preventDefault()
    if (!forgotEmail) {
      setForgotError('Te rugăm să introduci adresa de email.')
      return
    }
    setForgotError('')
    setForgotSuccess('')
    try {
      const result = await sendResetEmail({ email: forgotEmail }).unwrap()
      setForgotSuccess(result.message || 'Link-ul de resetare a fost trimis!')
      setForgotEmail('')
    } catch (err) {
      setForgotError(err?.data?.error || 'A apărut o eroare la trimiterea emailului. Încearcă din nou.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: (isRegistering || isForgotPassword) ? 420 : 400, padding: (isRegistering || isForgotPassword) ? 36 : undefined }}>
        {isRegistering ? (
          <ClientRegisterForm onToggleLogin={() => setIsRegistering(false)} />
        ) : isForgotPassword ? (
          <>
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--primary-dark)' }}>SERVIO</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Recuperare parolă</p>
            </div>

            {forgotError && (
              <div className="badge badge-red" style={{ display: 'block', marginBottom: 16, padding: '8px 12px', borderRadius: 'var(--radius)' }}>
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="badge badge-green" style={{ display: 'block', marginBottom: 16, padding: '8px 12px', borderRadius: 'var(--radius)' }}>
                {forgotSuccess}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label htmlFor="forgotEmail">Adresă de email</label>
                <input
                  id="forgotEmail"
                  type="email"
                  placeholder="tu@exemplu.ro"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }} disabled={isSendingForgot}>
                {isSendingForgot ? 'Se trimite…' : 'Trimite link de resetare'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
              Te-ai răzgândit?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false)
                  setForgotError('')
                  setForgotSuccess('')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--primary)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  font: 'inherit',
                  textDecoration: 'underline'
                }}
              >
                Înapoi la conectare
              </button>
            </p>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--primary-dark)' }}>SERVIO</h1>
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

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
              Ai uitat parola?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true)
                  setError('')
                  setForgotError('')
                  setForgotSuccess('')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--primary)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  font: 'inherit',
                  textDecoration: 'underline'
                }}
              >
                Recuperează parola
              </button>
            </p>

            <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
              Nu ai cont?{' '}
              <button
                type="button"
                onClick={() => setIsRegistering(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--primary)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  font: 'inherit',
                  textDecoration: 'underline'
                }}
              >
                Înregistrează-te
              </button>
            </p>

            <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
              Ești consultant?{' '}
              <Link to="/consultant" style={{ color: 'var(--primary)', fontWeight: 500 }}>Înregistrare consultant</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
