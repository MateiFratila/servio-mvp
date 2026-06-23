import { useState } from 'react'
import { useGetFeedbacksQuery, useDeleteFeedbackMutation, useGetPrivateReviewsQuery } from './adminApi'

const TYPE_BADGE = {
  contact: 'badge badge-blue',
  feedback: 'badge badge-green',
}

const TYPE_LABEL = {
  contact: 'Contact',
  feedback: 'Feedback',
}

export default function FeedbacksTab() {
  const { data, isLoading } = useGetFeedbacksQuery()
  const [deleteFeedback] = useDeleteFeedbackMutation()
  const feedbacks = data?.data ?? []

  const [privatePage, setPrivatePage] = useState(1)
  const { data: privateData, isLoading: isPrivateLoading } = useGetPrivateReviewsQuery({ page: privatePage, limit: 30 })
  const privateReviews = privateData?.data ?? []
  const totalPrivateReviews = privateData?.total ?? 0
  const totalPages = Math.ceil(totalPrivateReviews / 30)

  const handleDelete = async (id) => {
    if (window.confirm('Sigur doriți să ștergeți acest mesaj de feedback?')) {
      try {
        await deleteFeedback(id).unwrap()
      } catch (err) {
        alert(err?.data?.error || 'A apărut o eroare la ștergerea feedback-ului.')
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card">
        <h3 className="section-title">Support & Feedback Messages</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          Aici se găsesc toate mesajele de contact sau feedback transmise de utilizatorii platformei.
        </p>

        {isLoading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 100 }}>Data</th>
                  <th style={{ width: 160 }}>Expeditor</th>
                  <th style={{ width: 100 }}>Tip</th>
                  <th>Mesaj</th>
                  <th style={{ width: 100, textAlign: 'center' }}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((fb) => (
                  <tr key={fb.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {new Date(fb.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                      <div style={{ fontSize: 10, opacity: 0.6 }}>
                        {new Date(fb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{fb.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        <a href={`mailto:${fb.email}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {fb.email}
                        </a>
                      </div>
                    </td>
                    <td>
                      <span className={TYPE_BADGE[fb.type] ?? 'badge badge-grey'}>
                        {TYPE_LABEL[fb.type] ?? fb.type}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, whiteSpace: 'pre-wrap', maxWidth: 400, wordBreak: 'break-all', padding: '12px' }}>
                      {fb.message}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDelete(fb.id)}
                        style={{ color: 'var(--red)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '4px 8px', fontSize: 11 }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--red-bg)';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--red)';
                        }}
                      >
                        Șterge
                      </button>
                    </td>
                  </tr>
                ))}
                {feedbacks.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                      Nu există mesaje de feedback sau contact trimise.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">Private Reviews (Sesiuni)</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          Mărturiile private lăsate de către clienți, destinate exclusiv pentru platformă.
        </p>

        {isPrivateLoading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Se încarcă recenziile private…</p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 100 }}>Data</th>
                    <th style={{ width: 160 }}>Client</th>
                    <th style={{ width: 160 }}>Consultant</th>
                    <th style={{ width: 100 }}>Rating</th>
                    <th>Notă Privată</th>
                  </tr>
                </thead>
                <tbody>
                  {privateReviews.map((rev) => (
                    <tr key={rev.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {new Date(rev.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                        <div style={{ fontSize: 10, opacity: 0.6 }}>
                          {new Date(rev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{rev.displayName || 'Anonim'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rev.client?.email || 'N/A'}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{rev.consultant?.displayName || 'N/A'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              style={{ fontSize: 14, color: star <= rev.rating ? '#fbbf24' : '#e2e8f0' }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontSize: 13, whiteSpace: 'pre-wrap', padding: '12px' }}>
                        {rev.privateNotes}
                      </td>
                    </tr>
                  ))}
                  {privateReviews.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                        Nu există recenzii private înregistrate.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={privatePage === 1}
                  onClick={() => setPrivatePage((p) => p - 1)}
                >
                  ← Anterior
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Pagina {privatePage} din {totalPages} (Total: {totalPrivateReviews})
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={privatePage === totalPages}
                  onClick={() => setPrivatePage((p) => p + 1)}
                >
                  Următor →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
