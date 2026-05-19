import { useGetAdminStatsQuery } from './adminApi'

export default function PlatformOverviewTab() {
  const { data, isLoading } = useGetAdminStatsQuery()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="kpi-grid">
        <KPICard label="Total users" value={isLoading ? '—' : data?.totalUsers} />
        <KPICard label="Active consultants" value={isLoading ? '—' : data?.activeConsultants} />
        <KPICard label="Sessions this month" value={isLoading ? '—' : data?.sessionsThisMonth} />
        <KPICard label="Revenue (completed, est.)" value={isLoading ? '—' : `€${Number(data?.revenueEst ?? 0).toLocaleString()}`} />
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
