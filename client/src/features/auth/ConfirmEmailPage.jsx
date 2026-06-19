import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useConfirmEmailMutation } from './authApi'

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [confirmEmail, { isLoading }] = useConfirmEmailMutation()
  const [status, setStatus] = useState('pending') // 'pending' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('Token-ul de confirmare nu a fost găsit în link.')
      return
    }

    const runConfirmation = async () => {
      try {
        await confirmEmail({ token }).unwrap()
        setStatus('success')
        // Automatically redirect to /acasa after 4 seconds
        const timer = setTimeout(() => {
          navigate('/acasa', { replace: true })
        }, 4000)
        return () => clearTimeout(timer)
      } catch (err) {
        setStatus('error')
        setErrorMsg(err?.data?.error || 'Confirmarea emailului a eșuat sau link-ul este expirat/invalid.')
      }
    }

    runConfirmation()
  }, [token, confirmEmail, navigate])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: 40, textAlign: 'center' }}>
        {status === 'pending' && (
          <>
            <div style={{ fontSize: 44, marginBottom: 16, animation: 'spin 1.5s linear infinite' }}>⏳</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Se verifică adresa de email...</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Te rugăm să aștepți în timp ce confirmăm adresa ta de email în sistem.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: 44, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Email confirmat cu succes!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
              Adresa ta de email a fost verificată cu succes pe platforma SERVIO. În câteva secunde vei fi redirecționat către panoul tău.
            </p>
            <p style={{ marginTop: 24 }}>
              <Link to="/acasa" className="btn btn-primary" style={{ textDecoration: 'none', padding: '10px 24px' }}>
                Mergi la Acasă acum
              </Link>
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 44, marginBottom: 16 }}>❌</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Confirmare eșuată</h2>
            <p style={{ color: 'var(--red)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              {errorMsg}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
              Dacă întâmpini probleme, contactează suportul nostru tehnic sau încearcă o nouă solicitare.
            </p>
            <p>
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
                Înapoi la autentificare
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
