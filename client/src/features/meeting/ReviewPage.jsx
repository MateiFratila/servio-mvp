import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetSessionQuery, useSubmitReviewMutation } from '../catalogue/catalogueApi'

export default function ReviewPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { data: session, isLoading, error } = useGetSessionQuery(sessionId)
  const [submitReview, { isLoading: submitting }] = useSubmitReviewMutation()

  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [testimonial, setTestimonial] = useState('')
  const [privateNotes, setPrivateNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <p style={{ color: 'var(--text-muted)' }}>Se încarcă...</p>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <p style={{ color: 'var(--red)' }}>Sesiunea nu a fost găsită.</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Înapoi</button>
      </div>
    )
  }

  const startPassed = session.slot?.startTime ? (new Date() > new Date(session.slot.startTime)) : false
  const hasReview = !!session.review
  const shouldRender = startPassed || hasReview

  if (!shouldRender) {
    return null
  }

  const handleRatingClick = (val) => {
    setRating(val)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSuccess('')

    if (!testimonial.trim()) {
      setFormError('Te rugăm să introduci o scurtă mărturie publică pentru consultant.')
      return
    }

    try {
      await submitReview({
        sessionId: session.id,
        rating,
        testimonial: testimonial.trim(),
        privateNotes: privateNotes.trim() || undefined,
      }).unwrap()

      setSuccess('Recenzia a fost trimisă cu succes!')
      setTimeout(() => {
        navigate(`/sessions/${session.id}`)
      }, 2000)
    } catch (err) {
      setFormError(err?.data?.error || 'A apărut o eroare la trimiterea recenziei. Te rugăm să încerci din nou.')
    }
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 600 }}>
      <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate(`/sessions/${session.id}`)}>
        ← Înapoi la detalii ședință
      </button>

      <div className="card">
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Evaluează ședința</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
          Feedback-ul tău ne ajută să menținem Servio la cel mai înalt standard de calitate.
        </p>

        {session.review ? (
          <div>
            <div className="badge badge-green" style={{ display: 'block', padding: '12px', fontSize: 14, marginBottom: 20, background: '#d4edda', color: '#155724' }}>
              Ai oferit deja o recenzie pentru această ședință!
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <strong style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Consultant evaluat
                </strong>
                <span style={{ fontWeight: 500, fontSize: 15 }}>
                  {session.consultant?.displayName ?? '—'}
                </span>
              </div>

              <div>
                <strong style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Rating oferit
                </strong>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      style={{
                        fontSize: 24,
                        color: star <= session.review.rating ? '#fbbf24' : '#e2e8f0',
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <strong style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Mărturie publică
                </strong>
                <p style={{ margin: 0, padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--grey-bg)', fontSize: 14, whiteSpace: 'pre-wrap' }}>
                  {session.review.testimonial}
                </p>
              </div>

              {session.review.privateNotes && (
                <div>
                  <strong style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Recenzie privată (Vizibilă doar pentru admini Servio)
                  </strong>
                  <p style={{ margin: 0, padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--grey-bg)', fontSize: 14, whiteSpace: 'pre-wrap' }}>
                    {session.review.privateNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {formError && (
              <div className="badge badge-red" style={{ padding: '10px 12px', borderRadius: 'var(--radius)', textTransform: 'none', whiteSpace: 'normal', textAlign: 'left' }}>
                {formError}
              </div>
            )}

            {success && (
              <div className="badge badge-green" style={{ padding: '10px 12px', borderRadius: 'var(--radius)', textTransform: 'none', background: '#d4edda', color: '#155724', whiteSpace: 'normal', textAlign: 'left' }}>
                {success}
              </div>
            )}

            {/* Public Section */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 18, background: 'var(--surface)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 0, marginBottom: 12, color: 'var(--primary)' }}>
                1. Recenzie Publică
              </h3>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                  Rating (Număr de Stele)
                </label>
                <div style={{ display: 'flex', gap: 6, margin: '8px 0' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontSize: 32,
                        color: star <= (hoverRating || rating) ? '#fbbf24' : '#cbd5e1',
                        transition: 'color 0.15s ease',
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="testimonial" style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                  Mărturie publică (Scrie un scurt testimonial despre consultant)
                </label>
                <textarea
                  id="testimonial"
                  rows={4}
                  placeholder="Ex: Recomand cu căldură! Explicațiile au fost extrem de utile..."
                  value={testimonial}
                  onChange={(e) => setTestimonial(e.target.value)}
                  disabled={submitting}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '10px 12px', fontSize: 14,
                    border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--surface)', color: 'var(--text)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Private Section */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 18, background: 'var(--grey-bg)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 0, marginBottom: 6, color: 'var(--text)' }}>
                2. Recenzie Privată
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 0, marginBottom: 12 }}>
                Acest text este privat și va fi vizibil <strong>doar pentru adminii Servio</strong>. Consultantul nu îl va putea vedea.
              </p>

              <div className="form-group">
                <label htmlFor="privateNotes" style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                  Observații sau sugestii interne (opțional)
                </label>
                <textarea
                  id="privateNotes"
                  rows={3}
                  placeholder="Ex: Probleme tehnice, punctualitate, sugestii de îmbunătățire..."
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  disabled={submitting}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '10px 12px', fontSize: 14,
                    border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--surface)', color: 'var(--text)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ width: '100%', padding: '12px', fontSize: 15, fontWeight: 600 }}
            >
              {submitting ? 'Se trimite...' : 'Trimite Recenzia'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
