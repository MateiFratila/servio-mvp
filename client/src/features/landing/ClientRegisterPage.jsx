import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { setCredentials } from '../auth/authSlice'
import { useRegisterMutation } from '../auth/authApi'

export default function ClientRegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [register, { isLoading }] = useRegisterMutation()

  const [form, setForm] = useState({ email: '', password: '', confirm: '' })
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

    try {
      const result = await register({ email: form.email, password: form.password }).unwrap()
      dispatch(setCredentials({ user: result.user, token: result.token }))
      navigate('/acasa', { replace: true })
    } catch (err) {
      setError(err?.data?.error ?? 'Înregistrarea a eșuat. Încearcă din nou.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 36 }}>

        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Creează-ți contul</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Acces gratuit. Plătești doar sesiunile rezervate.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'var(--red-bg)',
            color: 'var(--red)',
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
            <label htmlFor="email">Adresă de email</label>
            <input
              id="email"
              type="email"
              placeholder="tu@exemplu.ro"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Parolă</label>
            <input
              id="password"
              type="password"
              placeholder="Minim 8 caractere"
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Confirmă parola</label>
            <input
              id="confirm"
              type="password"
              placeholder="Repetă parola"
              value={form.confirm}
              onChange={set('confirm')}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: 4, justifyContent: 'center', padding: '11px 0', fontSize: 15, fontWeight: 600 }}
            disabled={isLoading}
          >
            {isLoading ? 'Se creează contul…' : 'Creează cont'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          Ai deja cont?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Autentifică-te</Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          Ești consultant?{' '}
          <Link to="/consultant" style={{ color: 'var(--primary)', fontWeight: 500 }}>Înregistrare consultant</Link>
        </p>
      </div>
    </div>
  )
}
