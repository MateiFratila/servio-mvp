import { useParams } from 'react-router-dom'
import BookingPanel from './BookingPanel'
import MySessionsPanel from './MySessionsPanel'
import { useGetConsultantQuery } from './catalogueApi'
import { useLabels } from '../../lib/useLabels'

export default function ConsultantDetail() {
  const { id } = useParams()
  const { data: consultant, isLoading, isError } = useGetConsultantQuery(id)
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
