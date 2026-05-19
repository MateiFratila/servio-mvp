import { useNavigate } from 'react-router-dom'

const STATUS_BADGE = {
  pending: 'badge status-pending',
  confirmed: 'badge status-confirmed',
  completed: 'badge status-completed',
  cancelled: 'badge status-cancelled',
}

export default function ConsultantCard({ consultant }) {
  const navigate = useNavigate()
  const { id, displayName, specialisation, bio, hourlyRate, avatarUrl } = consultant

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src={avatarUrl ?? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`}
          alt={displayName}
          style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', background: 'var(--grey-bg)' }}
        />
        <div>
          <div style={{ fontWeight: 600 }}>{displayName}</div>
          <span className={STATUS_BADGE['confirmed']} style={{ fontSize: 11, background: 'var(--blue-bg)', color: 'var(--blue)' }}>
            {specialisation}
          </span>
        </div>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {bio}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>€{hourlyRate} / hr</span>
        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/catalog/${id}`)}>
          View Profile
        </button>
      </div>
    </div>
  )
}
