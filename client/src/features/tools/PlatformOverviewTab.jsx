const PLACEHOLDER_ACTIVITY = [
  { id: 1, text: 'Lorem Ipsum confirmed a session with Client A', time: '2 hours ago' },
  { id: 2, text: 'Dolor Sit updated their profile', time: '5 hours ago' },
  { id: 3, text: 'New consultant Amet Consult registered', time: '1 day ago' },
  { id: 4, text: 'Client B cancelled session #4821', time: '1 day ago' },
  { id: 5, text: 'Admin performed bulk availability reset', time: '2 days ago' },
]

export default function PlatformOverviewTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI cards */}
      <div className="kpi-grid">
        <KPICard label="Total users" value={128} />
        <KPICard label="Active consultants" value={24} />
        <KPICard label="Sessions this month" value={61} />
        <KPICard label="Platform revenue (est.)" value="€5,490" />
      </div>

      {/* Activity feed */}
      <div className="card">
        <h3 className="section-title">Recent Activity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {PLACEHOLDER_ACTIVITY.map((item, i) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: i < PLACEHOLDER_ACTIVITY.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: 14 }}>{item.text}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 16 }}>{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KPICard({ label, value }) {
  return (
    <div className="card kpi-card">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}
