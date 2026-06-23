import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { setCredentials } from './authSlice'
import { useRegisterMutation } from './authApi'

export default function ClientRegisterForm({ onToggleLogin }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [register, { isLoading }] = useRegisterMutation()

  const [form, setForm] = useState({ email: '', password: '', confirm: '' })
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.email || !form.password || !form.confirm) {
      setError('Completează toate câmpurile.')
      return
    }
    if (form.password.length < 8) {
      setError('Parola trebuie să aibă cel puțin 8 caractere.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Parolele nu coincid.')
      return
    }
    if (!agreed) {
      setError('Trebuie să fii de acord cu Termenii și Condițiile, Politica de Confidențialitate (GDPR) și Politica de Cookies.')
      return
    }

    try {
      const result = await register({ email: form.email, password: form.password }).unwrap()
      dispatch(setCredentials({ user: result.user, token: result.token }))
      
      const from = location.state?.from || '/acasa'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err?.data?.error ?? 'Înregistrarea a eșuat. Încearcă din nou.')
    }
  }

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
        <div style={{ borderRadius: 12, overflow: 'hidden', display: 'flex', marginBottom: 4 }}>
          <img src="/logo-long.jpg" alt="SERVIO Logo" style={{ height: 64, objectFit: 'contain', borderRadius: 12 }} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Creează-ți contul</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>
          Acces gratuit. Plătești doar sesiunile rezervate.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#fee2e2', // Fallback CSS vars style or hex as backup matching what was previously styled
          color: '#991b1b',
          border: '1px solid #fca5a5',
          borderRadius: 'var(--radius)',
          padding: '10px 14px',
          fontSize: 13,
          marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
        <div className="form-group">
          <label htmlFor="reg-email">Adresă de email</label>
          <input
            id="reg-email"
            type="email"
            placeholder="tu@exemplu.ro"
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="reg-password">Parolă</label>
          <input
            id="reg-password"
            type="password"
            placeholder="Minim 8 caractere"
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
          />
        </div>

        <div className="form-group">
          <label htmlFor="reg-confirm">Confirmă parola</label>
          <input
            id="reg-confirm"
            type="password"
            placeholder="Repetă parola"
            value={form.confirm}
            onChange={set('confirm')}
            autoComplete="new-password"
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, marginTop: 4, marginBottom: 4, lineHeight: '1.4' }}>
          <input
            type="checkbox"
            style={{ width: 'auto', marginTop: 3 }}
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span style={{ color: 'var(--text-muted)' }}>
            Sunt de acord cu{' '}
            <Link to="/legal/termeni" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'underline' }}>
              Termenii și Condițiile
            </Link>
            {', '}
            <Link to="/legal/confidentialitate" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'underline' }}>
              Politica de Confidențialitate (GDPR)
            </Link>
            {' și '}
            <Link to="/legal/cookies" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'underline' }}>
              Politica de Cookies
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ marginTop: 4, justifyContent: 'center', padding: '11px 0', fontSize: 15, fontWeight: 600 }}
          disabled={isLoading || !agreed}
        >
          {isLoading ? 'Se creează contul…' : 'Creează cont'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
        Ai deja cont?{' '}
        {onToggleLogin ? (
          <button
            type="button"
            onClick={onToggleLogin}
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
            Autentifică-te
          </button>
        ) : (
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Autentifică-te</Link>
        )}
      </p>

      <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
        Ești consultant?{' '}
        <Link to="/consultant" style={{ color: 'var(--primary)', fontWeight: 500 }}>Înregistrare consultant</Link>
      </p>
    </>
  )
}
