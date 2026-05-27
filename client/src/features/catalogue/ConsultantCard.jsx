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
  const { id, displayName, specialisations = [], bio, hourlyRate } = consultant
  const specNames = specialisations.map((cs) => cs.specialisation.name)
  const avatarSrc = `/api/consultants/${id}/avatar`

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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 3 }}>
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
        {bio}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>€{hourlyRate} {t.consultantCard.perHour} <span style={{ fontWeight: 400, fontSize: '0.85em', color: 'var(--text-muted)' }}>{t.consultantCard.plusVat}</span></span>
        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/catalog/${id}`)}>
          {t.consultantCard.viewProfile}
        </button>
      </div>
    </div>
  )
}
