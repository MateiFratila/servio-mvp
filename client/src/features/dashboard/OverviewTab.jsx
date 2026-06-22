import { useNavigate } from 'react-router-dom'
import { useGetMySessionsAsConsultantQuery } from './dashboardApi'
import { useLabels } from '../../lib/useLabels'

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_BADGE = {
  pending: 'badge status-pending',
  pending_confirmation: 'badge status-pending',
  confirmed: 'badge status-confirmed',
  completed: 'badge status-completed',
  cancelled: 'badge status-cancelled',
}

export default function OverviewTab({ consultantName }) {
  const { data } = useGetMySessionsAsConsultantQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  })
  const navigate = useNavigate()
  const t = useLabels()
  const allSessions = data?.data ?? []

  const now = new Date()
  const upcoming = allSessions
    .filter((s) => s.status !== 'cancelled' && s.status !== 'completed' && new Date(s.slot?.startTime) >= now)
    .slice(0, 3)

  const pending = allSessions.filter((s) => s.status === 'pending_confirmation').length
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const completedThisMonth = allSessions.filter(
    (s) => s.status === 'completed' && new Date(s.createdAt) >= monthStart
  ).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ background: 'var(--blue-bg)', border: '1px solid rgba(55, 125, 255, 0.15)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary-blue)', letterSpacing: '-0.02em' }}>
          {t.overview.welcomeBack(consultantName ?? '—')}
        </h2>
        <p style={{ color: 'var(--primary-blue)', fontSize: 14, marginTop: 6, fontWeight: 500, opacity: 0.9 }}>
          {t.overview.activitySummary}
        </p>
      </div>

      <div className="kpi-grid">
        <KPICard label={t.overview.kpi.upcoming} value={upcoming.length} />
        <KPICard label={t.overview.kpi.pendingConfirmation} value={pending} accent />
        <KPICard label={t.overview.kpi.completedThisMonth} value={completedThisMonth} />
        <KPICard label={t.overview.kpi.total} value={allSessions.length} />
      </div>

      <div className="card">
        <h3 className="section-title">{t.overview.upcomingTitle}</h3>
        {upcoming.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t.overview.noUpcoming}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcoming.map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{s.client?.email ?? '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{fmtDateTime(s.slot?.startTime)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={STATUS_BADGE[s.status]}>{t.statusLabels[s.status] ?? s.status}</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/sessions/${s.id}`)}>{t.overview.seeDetails}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function KPICard({ label, value, accent }) {
  return (
    <div className="card kpi-card">
      <div className="kpi-value" style={accent ? { color: 'var(--yellow)' } : {}}>{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}
