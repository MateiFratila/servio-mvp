import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRegisterConsultantMutation } from '../auth/authApi'

export default function ConsultantRegisterPage() {
  const [registerConsultant, { isLoading }] = useRegisterConsultantMutation()

  const [form, setForm] = useState({ email: '', phone: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.email || !form.password || !form.confirm) {
      setError('Completează toate câmpurile obligatorii.')
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
      await registerConsultant({ email: form.email, password: form.password, phone: form.phone || undefined }).unwrap()
      setSuccess(true)
    } catch (err) {
      setError(err?.data?.error ?? 'Înregistrarea a eșuat. Încearcă din nou.')
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
        <div className="card" style={{ maxWidth: 440, width: '100%', padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Cerere trimisă!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
            Echipa noastră va revizui cererea ta și te va contacta în curând pe adresa de email indicată pentru a finaliza activarea contului.
          </p>
          <p style={{ marginTop: 24, fontSize: 13 }}>
            <Link to="/consultant" style={{ color: 'var(--primary)', fontWeight: 500 }}>← Înapoi la pagina consultanților</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: 36 }}>

        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🧑‍💼</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Înregistrare consultant</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Completează formularul — echipa noastră va revizui cererea și te vom activa în platformă.
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
            <label htmlFor="email">Adresă de email <span style={{ color: 'var(--red)' }}>*</span></label>
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
            <label htmlFor="phone">Număr de telefon</label>
            <input
              id="phone"
              type="tel"
              placeholder="+40 7XX XXX XXX"
              value={form.phone}
              onChange={set('phone')}
              autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Parolă <span style={{ color: 'var(--red)' }}>*</span></label>
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
            <label htmlFor="confirm">Confirmă parola <span style={{ color: 'var(--red)' }}>*</span></label>
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
            {isLoading ? 'Se trimite cererea…' : 'Trimite cererea'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          Ai deja cont?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Autentifică-te</Link>
          {' · '}
          <Link to="/consultant" style={{ color: 'var(--primary)', fontWeight: 500 }}>← Înapoi</Link>
        </p>
      </div>
    </div>
  )
}
