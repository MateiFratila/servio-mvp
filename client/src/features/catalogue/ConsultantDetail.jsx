import { useState } from 'react'
import { useParams } from 'react-router-dom'
import BookingPanel from './BookingPanel'
import MySessionsPanel from './MySessionsPanel'
import { useGetConsultantQuery, useGetConsultantReviewsQuery } from './catalogueApi'
import { useLabels } from '../../lib/useLabels'
import ReviewsTable from '../../components/ReviewsTable'

export default function ConsultantDetail() {
  const { id } = useParams()
  const { data: consultant, isLoading, isError } = useGetConsultantQuery(id)
  const [showReviews, setShowReviews] = useState(false)
  const [ratingHovered, setRatingHovered] = useState(false)
  const { data: reviews, isLoading: reviewsLoading } = useGetConsultantReviewsQuery(id)
  const t = useLabels()

  if (isLoading) return <div className="container" style={{ padding: '48px 24px', color: 'var(--text-muted)' }}>Loading…</div>
  if (isError || !consultant) return <div className="container" style={{ padding: '48px 24px', color: 'var(--text-muted)' }}>Consultant not found.</div>

  const specNames = (consultant.specialisations ?? []).map((cs) => cs.specialisation.name)
  const tags = (consultant.expertiseCategories ?? []).map((ec) => ec.category.name)
  const avatarSrc = `/api/consultants/${id}/avatar`
  const bannerSrc = `/api/consultants/${id}/banner`

  return (
    <div className="container" style={{ padding: '32px 24px', display: 'flex', gap: 32, alignItems: 'flex-start' }}>
      {/* Profile – left */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Profile card with banner background */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Banner */}
          <div style={{ position: 'relative', height: 160, background: 'var(--grey-bg)' }}>
            <img
              src={bannerSrc}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            {/* Avatar — overlaps banner bottom */}
            <div style={{
              position: 'absolute',
              bottom: -40,
              left: 24,
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: '3px solid var(--surface)',
              background: 'var(--grey-bg)',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              <img
                src={avatarSrc}
                alt={consultant.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(consultant.displayName)}` }}
              />
            </div>
          </div>

          {/* Content — paddingTop leaves room for the overlapping avatar */}
          <div style={{ padding: '52px 24px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{consultant.displayName}</h2>
              <span style={{ fontWeight: 600, fontSize: 16, whiteSpace: 'nowrap' }}>€{Number(consultant.hourlyRate).toFixed(0)} {t.consultantCard.perHour} <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--text-muted)' }}>{t.consultantCard.plusVat}</span></span>
            </div>
            {/* Rating badge */}
            {consultant.averageRating != null && (() => {
              const rating = Number(consultant.averageRating)
              return (
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 10 }}>
                  <button
                    onClick={() => setShowReviews((v) => !v)}
                    onMouseEnter={() => setRatingHovered(true)}
                    onMouseLeave={() => setRatingHovered(false)}
                    style={{
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {/* 5-star bar */}
                    <span style={{ position: 'relative', display: 'inline-block', fontSize: 18, lineHeight: 1, letterSpacing: 1 }}>
                      {/* empty stars */}
                      <span style={{ color: '#d1d5db' }}>{'★★★★★'}</span>
                      {/* filled stars clipped to rating */}
                      <span style={{
                        position: 'absolute', top: 0, left: 0, overflow: 'hidden',
                        width: `${(rating / 5) * 100}%`,
                        color: '#f5a623',
                        whiteSpace: 'nowrap',
                      }}>{'★★★★★'}</span>
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {rating.toFixed(1)}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                      ({reviews?.length ?? 0} {reviews?.length === 1 ? 'recenzie' : 'recenzii'})
                    </span>
                  </button>
                  {ratingHovered && (
                    <div style={{
                      position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                      marginBottom: 6, whiteSpace: 'nowrap',
                      background: 'var(--text, #111)', color: '#fff',
                      fontSize: 12, fontWeight: 500,
                      padding: '4px 10px', borderRadius: 6,
                      pointerEvents: 'none',
                    }}>
                      {showReviews ? 'Înapoi la profil' : 'Vezi toate recenziile'}
                      <span style={{
                        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: '5px solid var(--text, #111)',
                      }} />
                    </div>
                  )}
                </div>
              )
            })()}
            {showReviews ? (
              <>
                <button
                  onClick={() => setShowReviews(false)}
                  style={{
                    background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 500, color: 'var(--blue)',
                    marginBottom: 8,
                  }}
                >
                  ← Înapoi la profil
                </button>
                <ReviewsTable
                  reviews={reviews ?? []}
                  isLoading={reviewsLoading}
                  consultantUserId={consultant.userId}
                  consultantDisplayName={consultant.displayName}
                />
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {specNames.map((name) => (
                    <span key={name} className="badge badge-blue">{name}</span>
                  ))}
                </div>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 14 }}>{consultant.description}</p>
                {consultant.specialisations?.length > 0 && consultant.expertiseCategories?.length > 0 && (
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {consultant.specialisations.map((cs) => {
                      const areas = consultant.expertiseCategories.filter((ec) => ec.category.specialisationId === cs.specialisation.id)
                      if (areas.length === 0) return null
                      return (
                        <div key={cs.specialisation.id}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{cs.specialisation.name}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {areas.map((ec) => (
                              <span key={ec.category.id} className="badge badge-grey">{ec.category.name}</span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {consultant.languages?.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Languages:</span>
                    {consultant.languages.map((code) => (
                      <span key={code} style={{ padding: '2px 8px', borderRadius: 999, border: '1px solid var(--border)', fontSize: 12 }}>{code.toUpperCase()}</span>
                    ))}
                  </div>
                )}
                {consultant.tags?.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {consultant.tags.map((t) => (
                      <span key={t.id} style={{ padding: '2px 10px', borderRadius: 999, background: 'var(--blue-bg)', color: 'var(--blue)', fontSize: 12, fontWeight: 500 }}>#{t.tag}</span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <MySessionsPanel />
      </div>

      {/* Booking panel – right */}
      <div style={{ width: 320, flexShrink: 0 }}>
        <BookingPanel consultantId={Number(id)} consultantName={consultant.displayName} />
      </div>
    </div>
  )
}
