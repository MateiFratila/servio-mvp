import { useGetFeedbacksQuery, useDeleteFeedbackMutation } from './adminApi'

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
  )
}
