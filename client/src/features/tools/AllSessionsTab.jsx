import { useState } from 'react'

const PLACEHOLDER_SESSIONS = [
  { id: 4821, client: 'Client B', consultant: 'Lorem Ipsum', date: '20 May 2026', status: 'pending' },
  { id: 4820, client: 'Ipsum Corp', consultant: 'Dolor Sit', date: '22 May 2026', status: 'confirmed' },
  { id: 4819, client: 'Dolor Ltd', consultant: 'Amet Consult', date: '25 May 2026', status: 'confirmed' },
  { id: 4818, client: 'Sit Advisory', consultant: 'Lorem Ipsum', date: '10 May 2026', status: 'completed' },
  { id: 4817, client: 'Amet Holdings', consultant: 'Consectetur Adv.', date: '05 May 2026', status: 'cancelled' },
]

const STATUSES = ['All', 'pending', 'confirmed', 'completed', 'cancelled']

const STATUS_BADGE = {
  pending: 'badge status-pending',
  confirmed: 'badge status-confirmed',
  completed: 'badge status-completed',
  cancelled: 'badge status-cancelled',
}

export default function AllSessionsTab() {
  const [statusFilter, setStatusFilter] = useState('All')
  const [sessions, setSessions] = useState(PLACEHOLDER_SESSIONS)
  // TODO: const { data: sessions = [] } = useGetAllSessionsQuery({ status: statusFilter !== 'All' ? statusFilter : undefined })
  // TODO: const [forceDelete] = useForceDeleteSessionMutation()

  function forceCancel(id) {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, status: 'cancelled' } : s))
  }

  const filtered = sessions.filter((s) => statusFilter === 'All' ? true : s.status === statusFilter)

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>All Sessions</h3>
        <div className="tab-bar" style={{ marginBottom: 0, borderBottom: 'none', gap: 4 }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`tab-btn${statusFilter === s ? ' active' : ''}`}
              style={{ padding: '4px 12px', fontSize: 12 }}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Client</th>
              <th>Consultant</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{s.id}</td>
                <td>{s.client}</td>
                <td style={{ fontWeight: 500 }}>{s.consultant}</td>
                <td style={{ color: 'var(--text-muted)' }}>{s.date}</td>
                <td><span className={STATUS_BADGE[s.status]}>{s.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm">View</button>
                    {s.status !== 'cancelled' && s.status !== 'completed' && (
                      <button className="btn btn-danger btn-sm" onClick={() => forceCancel(s.id)}>
                        Force-cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
