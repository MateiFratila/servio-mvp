import { useGetMySessionsAsConsultantQuery, useUpdateSessionStatusMutation } from './dashboardApi'

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_BADGE = {
  pending: 'badge status-pending',
  confirmed: 'badge status-confirmed',
  completed: 'badge status-completed',
  cancelled: 'badge status-cancelled',
}

export default function OverviewTab({ consultantName }) {
  const { data } = useGetMySessionsAsConsultantQuery()
  const [updateStatus] = useUpdateSessionStatusMutation()
  const allSessions = data?.data ?? []

  const now = new Date()
  const upcoming = allSessions
    .filter((s) => s.status !== 'cancelled' && s.status !== 'completed' && new Date(s.slot?.startTime) >= now)
    .slice(0, 3)

  const pending = allSessions.filter((s) => s.status === 'pending').length
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const completedThisMonth = allSessions.filter(
    (s) => s.status === 'completed' && new Date(s.createdAt) >= monthStart
  ).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ background: 'var(--blue-bg)', border: '1px solid #bfdbfe' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
          Welcome back, {consultantName ?? '—'}.
        </h2>
        <p style={{ color: 'var(--primary)', fontSize: 13, marginTop: 4, opacity: 0.8 }}>
          Here's a summary of your activity.
        </p>
      </div>

      <div className="kpi-grid">
        <KPICard label="Upcoming sessions" value={upcoming.length} />
        <KPICard label="Pending confirmation" value={pending} accent />
        <KPICard label="Completed this month" value={completedThisMonth} />
        <KPICard label="Total sessions" value={allSessions.length} />
      </div>

      <div className="card">
        <h3 className="section-title">Upcoming Sessions</h3>
        {upcoming.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No upcoming sessions.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcoming.map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{s.client?.email ?? '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{fmtDateTime(s.slot?.startTime)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={STATUS_BADGE[s.status]}>{s.status}</span>
                  {s.status === 'pending' && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => updateStatus({ id: s.id, status: 'confirmed' })}>Confirm</button>
                      <button className="btn btn-danger btn-sm" onClick={() => updateStatus({ id: s.id, status: 'cancelled' })}>Decline</button>
                    </>
                  )}
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
