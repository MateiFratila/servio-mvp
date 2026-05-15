// TODO: replace with useGetMySessionsAsConsultantQuery() filtered by upcoming
const PLACEHOLDER_UPCOMING = [
  { id: 4821, client: 'Client A', dateTime: '20 May 2026, 10:30', status: 'pending' },
  { id: 4820, client: 'Client B', dateTime: '22 May 2026, 09:00', status: 'confirmed' },
  { id: 4819, client: 'Client C', dateTime: '28 May 2026, 14:00', status: 'confirmed' },
]

const STATUS_BADGE = {
  pending: 'badge status-pending',
  confirmed: 'badge status-confirmed',
  completed: 'badge status-completed',
  cancelled: 'badge status-cancelled',
}

export default function OverviewTab({ consultantName }) {
  const sessions = PLACEHOLDER_UPCOMING

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome */}
      <div className="card" style={{ background: 'var(--blue-bg)', border: '1px solid #bfdbfe' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
          Welcome back, {consultantName ?? 'Lorem Ipsum'}.
        </h2>
        <p style={{ color: 'var(--primary)', fontSize: 13, marginTop: 4, opacity: 0.8 }}>
          Here's a summary of your activity.
        </p>
      </div>

      {/* KPI cards */}
      <div className="kpi-grid">
        <KPICard label="Upcoming sessions" value={3} />
        <KPICard label="Pending confirmation" value={1} accent />
        <KPICard label="Completed this month" value={7} />
        <KPICard label="Profile views" value={42} />
      </div>

      {/* Upcoming sessions */}
      <div className="card">
        <h3 className="section-title">Upcoming Sessions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{s.client}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.dateTime}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={STATUS_BADGE[s.status]}>{s.status}</span>
                {s.status === 'pending' && (
                  <>
                    <button className="btn btn-primary btn-sm">Confirm</button>
                    <button className="btn btn-danger btn-sm">Decline</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
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
