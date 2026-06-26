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
  const [copied, setCopied] = useState(false)
  const { data: reviews, isLoading: reviewsLoading } = useGetConsultantReviewsQuery(id)
  const t = useLabels()

  if (isLoading) return <div className="container" style={{ padding: '48px 24px', color: 'var(--text-muted)' }}>Loading…</div>
  if (isError || !consultant) return <div className="container" style={{ padding: '48px 24px', color: 'var(--text-muted)' }}>Consultant not found.</div>

  const specNames = (consultant.specialisations ?? []).map((cs) => cs.specialisation.name)
  const tags = (consultant.expertiseCategories ?? []).map((ec) => ec.category.name)
  const cacheBuster = consultant?.updatedAt ? `?v=${new Date(consultant.updatedAt).getTime()}` : ''
  const avatarSrc = `/api/consultants/${consultant.id}/avatar${cacheBuster}`
  const bannerSrc = `/api/consultants/${consultant.id}/banner${cacheBuster}`

  const shareUrl = `${window.location.origin}/consultant/${consultant.slug}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

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
            <div>
              <div style={{ minWidth: 0 }}>
                {/* Share links column */}
                <div style={{
                  display: 'flex',
                  float: 'right',
                  gap: 8,
                  alignItems: 'center',
                  background: 'var(--grey-bg)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  marginLeft: 16,
                  marginBottom: 16,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Distribuie
                  </span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Share on Facebook"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: '#1877F2',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 119, 242, 0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                      </svg>
                    </a>

                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Share on LinkedIn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: '#0A66C2',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(10, 102, 194, 0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                      </svg>
                    </a>

                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Share on WhatsApp"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: '#25D366',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.81 9.81 0 0 0 12.04 2zm5.79 14.21c-.24.68-1.19 1.25-1.9 1.33-.49.06-1.13.09-3.25-.74-2.72-1.06-4.47-3.83-4.61-4.01-.13-.19-1.11-1.48-1.11-2.81 0-1.33.68-1.98.92-2.25.24-.26.54-.33.72-.33h.51c.16 0 .37-.06.58.44.22.51.75 1.83.81 1.95.07.12.11.26.03.41-.08.15-.12.24-.24.38-.12.14-.25.31-.36.42-.12.12-.25.25-.11.48.14.23.63 1.03 1.35 1.67.93.83 1.71 1.09 1.95 1.21.24.12.38.1.52-.06.14-.17.62-.72.78-.97.16-.25.32-.21.54-.12s1.42.67 1.67.79c.25.12.41.18.47.28.06.1.06.57-.18 1.25z" />
                      </svg>
                    </a>

                    <button
                      onClick={handleCopyLink}
                      title="Copiaza link"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 32,
                        borderRadius: copied ? '16px' : '50%',
                        padding: copied ? '0 10px' : 0,
                        width: copied ? 'auto' : 32,
                        background: copied ? 'var(--green-bg)' : 'var(--surface)',
                        border: copied ? '1px solid var(--green)' : '1px solid var(--border)',
                        color: copied ? 'var(--green)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                      onMouseEnter={(e) => {
                        if (!copied) {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(100, 116, 139, 0.15)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      {copied ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Copiat!
                        </span>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

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
                    <div
                      style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 14 }}
                      dangerouslySetInnerHTML={{ __html: consultant.description || '' }}
                    />
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
          </div>
        </div>

        <MySessionsPanel />
      </div>

      {/* Booking panel – right */}
      <div style={{ width: 320, flexShrink: 0 }}>
        <BookingPanel
          consultantId={Number(consultant.id)}
          consultantName={consultant.displayName}
          hasCurrentAvailability={consultant.hasCurrentAvailability}
        />
      </div>
    </div>
  )
}
