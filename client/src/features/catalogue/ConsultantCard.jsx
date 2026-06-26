import { useNavigate } from 'react-router-dom'
import { useLabels } from '../../lib/useLabels'

const STATUS_BADGE = {
  pending: 'badge status-pending',
  confirmed: 'badge status-confirmed',
  completed: 'badge status-completed',
  cancelled: 'badge status-cancelled',
}

export default function ConsultantCard({ consultant }) {
  const navigate = useNavigate()
  const t = useLabels()
  const { id, slug, displayName, specialisations = [], description, hourlyRate, averageRating, _count, updatedAt } = consultant
  const specNames = specialisations.map((cs) => cs.specialisation.name)
  const cacheBuster = updatedAt ? `?v=${new Date(updatedAt).getTime()}` : ''
  const avatarSrc = `/api/consultants/${id}/avatar${cacheBuster}`
  const ratingVal = averageRating != null ? Number(averageRating) : 0
  const reviewsCount = _count?.reviews ?? 0

  const stripHtml = (html) => {
    if (!html) return ''
    let text = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    text = text.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
    text = text.replace(/<[^>]*>/g, ' ')
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
    return text.replace(/\s+/g, ' ').trim()
  }

  const plainBio = stripHtml(description)

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src={avatarSrc}
          alt={displayName}
          style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', background: 'var(--grey-bg)' }}
          onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}` }}
        />
        <div>
          <div style={{ fontWeight: 600 }}>{displayName}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span style={{ position: 'relative', display: 'inline-block', fontSize: 13, lineHeight: 1, letterSpacing: 0.5 }}>
              <span style={{ color: '#d1d5db' }}>{'★★★★★'}</span>
              <span style={{
                position: 'absolute', top: 0, left: 0, overflow: 'hidden',
                width: `${(ratingVal / 5) * 100}%`,
                color: '#f5a623',
                whiteSpace: 'nowrap',
              }}>{'★★★★★'}</span>
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>
              {ratingVal > 0 ? ratingVal.toFixed(1) : '—'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              ({reviewsCount})
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {specNames.length > 0 ? specNames.map((name) => (
              <span key={name} className={STATUS_BADGE['confirmed']} style={{ fontSize: 11, background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                {name}
              </span>
            )) : (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
            )}
          </div>
        </div>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {plainBio}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>€{hourlyRate} {t.consultantCard.perHour} <span style={{ fontWeight: 400, fontSize: '0.85em', color: 'var(--text-muted)' }}>{t.consultantCard.plusVat}</span></span>
        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/catalog/${slug || id}`)}>
          {t.consultantCard.viewProfile}
        </button>
      </div>
    </div>
  )
}
