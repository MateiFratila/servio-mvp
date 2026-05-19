import { useParams } from 'react-router-dom'
import BookingPanel from './BookingPanel'
import MySessionsPanel from './MySessionsPanel'
import { useGetConsultantQuery } from './catalogueApi'

export default function ConsultantDetail() {
  const { id } = useParams()
  const { data: consultant, isLoading, isError } = useGetConsultantQuery(id)

  if (isLoading) return <div className="container" style={{ padding: '48px 24px', color: 'var(--text-muted)' }}>Loading…</div>
  if (isError || !consultant) return <div className="container" style={{ padding: '48px 24px', color: 'var(--text-muted)' }}>Consultant not found.</div>

  const tags = [consultant.specialisation].filter(Boolean)

  return (
    <div className="container" style={{ padding: '32px 24px', display: 'flex', gap: 32, alignItems: 'flex-start' }}>
      {/* Profile – left */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="card" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <img
            src={consultant.avatarUrl ?? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(consultant.displayName)}`}
            alt={consultant.displayName}
            style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: 'var(--grey-bg)' }}
          />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{consultant.displayName}</h2>
            <span className="badge badge-blue" style={{ marginBottom: 12, display: 'inline-block' }}>{consultant.specialisation}</span>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 14 }}>{consultant.description}</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>€{Number(consultant.hourlyRate).toFixed(0)} / hr</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {tags.map((t) => (
                  <span key={t} className="badge badge-grey">{t}</span>
                ))}
              </div>
            </div>
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
