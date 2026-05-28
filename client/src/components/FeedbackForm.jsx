import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../features/auth/authSlice'
import { useSubmitFeedbackMutation } from '../features/contul-meu/feedbackApi'

export default function FeedbackForm({ initialType = 'contact', onSuccess }) {
  const user = useSelector(selectCurrentUser)
  const [submitFeedback, { isLoading }] = useSubmitFeedbackMutation()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [type, setType] = useState(initialType)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  useEffect(() => {
    setType(initialType)
  }, [initialType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim()) {
      setError('Te rugăm să introduci numele.')
      return
    }
    if (!email.trim()) {
      setError('Te rugăm să introduci adresa de email.')
      return
    }
    if (!message.trim()) {
      setError('Te rugăm să introduci mesajul tău.')
      return
    }

    try {
      await submitFeedback({
        name: name.trim(),
        email: email.trim(),
        type,
        message: message.trim(),
      }).unwrap()

      setSuccess('Mesajul tău a fost trimis cu succes! Îți mulțumim.')
      setMessage('')
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err?.data?.error || 'A apărut o eroare la trimiterea mesajului. Te rugăm să încerci din nou mai târziu.')
    }
  }

  return (
    <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
        {type === 'contact' ? 'Contactează-ne' : 'Trimite Feedback'}
      </h3>

      {error && (
        <div className="badge badge-red" style={{ display: 'block', marginBottom: 16, padding: '8px 12px', borderRadius: 'var(--radius)', whiteSpace: 'normal', textAlign: 'left' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="badge badge-green" style={{ display: 'block', marginBottom: 16, padding: '8px 12px', borderRadius: 'var(--radius)', color: '#155724', background: '#d4edda', whiteSpace: 'normal', textAlign: 'left' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label htmlFor="feedback-name">Nume complet</label>
          <input
            id="feedback-name"
            type="text"
            placeholder="Numele tău"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading || !!user?.name}
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedback-email">Adresă de email</label>
          <input
            id="feedback-email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || !!user?.email}
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedback-type">Tip solicitare</label>
          <select
            id="feedback-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: 14,
            }}
          >
            <option value="contact">Contact direct</option>
            <option value="feedback">Feedback platformă</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="feedback-message">Mesaj</label>
          <textarea
            id="feedback-message"
            rows="5"
            placeholder={type === 'contact' ? 'Cum te putem ajuta...' : 'Spune-ne părerea ta despre platformă...'}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: 14,
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }} disabled={isLoading}>
          {isLoading ? 'Se trimite...' : 'Trimite mesaj'}
        </button>
      </form>
    </div>
  )
}
