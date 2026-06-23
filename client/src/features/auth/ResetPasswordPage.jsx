import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useResetPasswordMutation } from './authApi'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [resetPassword, { isLoading }] = useResetPasswordMutation()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!token) {
      setError('Tokenul de resetare lipsește. Te rugăm să folosești link-ul din email sau să soliciți unul nou.')
      return
    }
    if (!password || !confirmPassword) {
      setError('Ambele câmpuri de parolă sunt obligatorii.')
      return
    }
    if (password.length < 8) {
      setError('Parola trebuie să aibă cel puțin 8 caractere.')
      return
    }
    if (password !== confirmPassword) {
      setError('Parolele introduce nu se potrivesc.')
      return
    }

    setError('')
    setSuccess('')
    try {
      const result = await resetPassword({ token, password }).unwrap()
      setSuccess(result.message || 'Parola a fost modificată cu succes!')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err?.data?.error || 'A apărut o eroare. Token-ul poate fi expirat sau invalid.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 36 }}>
        <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ borderRadius: 12, overflow: 'hidden', display: 'flex' }}>
            <img src="/logo-long.jpg" alt="SERVIO Logo" style={{ height: 64, objectFit: 'contain', borderRadius: 12 }} />
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>Setează o nouă parolă</p>
        </div>

        {error && (
          <div className="badge badge-red" style={{ display: 'block', marginBottom: 16, padding: '8px 12px', borderRadius: 'var(--radius)' }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div className="badge badge-green" style={{ display: 'block', marginBottom: 20, padding: '8px 12px', borderRadius: 'var(--radius)' }}>
              {success}
            </div>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none', width: '100%', boxSizing: 'border-box' }}>
              Mergi la conectare
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label htmlFor="password">Noua parolă</label>
              <input
                id="password"
                type="password"
                placeholder="Cel puțin 8 caractere"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmă noua parolă</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Re-introduceți noua parolă"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }} disabled={isLoading || !token}>
              {isLoading ? 'Se salvează…' : 'Actualizează parola'}
            </button>

            {!token && (
              <p style={{ color: 'var(--text-danger)', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                Token lipsă. Nu poți reseta parola fără un link valid.
              </p>
            )}
          </form>
        )}

        {!success && (
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'underline' }}>
              Înapoi la conectare
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
