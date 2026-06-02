import { useState } from 'react'

const PAGE_SIZE = 5

/**
 * ReviewsTable — reusable component that renders a list of consultant reviews
 * with their replies expanded inline.
 *
 * Props:
 *   reviews              — array from GET /consultants/me/reviews (or any compatible shape)
 *   isLoading            — boolean
 *   consultantUserId     — the consultant's user id (to identify their replies)
 *   consultantDisplayName — the consultant's display name
 */
export default function ReviewsTable({ reviews = [], isLoading, consultantUserId, consultantDisplayName }) {
  const [page, setPage] = useState(1)

  function resolveAuthor(reply, review) {
    if (consultantUserId && reply.authorId === consultantUserId) {
      return consultantDisplayName || 'Consultant'
    }
    if (review.session?.clientId && reply.authorId === review.session.clientId) {
      return review.displayName || 'Anonim'
    }
    return 'Anonim'
  }
  if (isLoading) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Se încarcă recenziile...</p>
  }

  if (!reviews.length) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
        Nu există recenzii încă.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {reviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((review) => (
        <div
          key={review.id}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}
        >
          {/* Review header */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'flex-start',
              padding: '14px 16px',
              background: 'var(--surface)',
              borderBottom: review.replies?.length ? '1px solid var(--border)' : 'none',
            }}
          >
            {/* Stars */}
            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{ fontSize: 18, color: star <= review.rating ? '#fbbf24' : '#e2e8f0' }}
                >
                  ★
                </span>
              ))}
            </div>

            {/* Testimonial + meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {review.testimonial}
              </p>
              <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>
                  <strong>Client:</strong> {review.displayName || 'Anonim'}
                </span>

                <span>
                  <strong>Postat:</strong>{' '}
                  {new Date(review.createdAt).toLocaleDateString('ro-RO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                {review.session?.id && (
                  <a
                    href={`/sessions/${review.session.id}/review`}
                    style={{ color: 'var(--primary)', textDecoration: 'none' }}
                  >
                    Vezi recenzia →
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Replies */}
          {review.replies?.length > 0 && (
            <div style={{ background: 'var(--grey-bg)', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {review.replies.map((reply) => (
                <div
                  key={reply.id}
                  style={{
                    display: 'flex',
                    gap: 10,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0, paddingTop: 1 }}>↳</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 500, marginRight: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                      {resolveAuthor(reply, review)}:
                    </span>
                    <span style={{ color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {reply.content}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {reviews.length > PAGE_SIZE && (() => {
        const totalPages = Math.ceil(reviews.length / PAGE_SIZE)
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Anterior
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {page} / {totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Următor →
            </button>
          </div>
        )
      })()}
    </div>
  )
}
