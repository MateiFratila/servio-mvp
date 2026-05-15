import { useState } from 'react'

const PLACEHOLDER_SESSIONS = [
  { id: 4821, client: 'Lorem Client', dateTime: '20 May 2026, 10:30', status: 'pending', notes: 'Need advice on Q2 VAT filing.' },
  { id: 4820, client: 'Ipsum Corp', dateTime: '22 May 2026, 09:00', status: 'confirmed', notes: 'Annual payroll review.' },
  { id: 4819, client: 'Dolor Ltd', dateTime: '25 May 2026, 16:00', status: 'confirmed', notes: '' },
  { id: 4818, client: 'Sit Advisory', dateTime: '10 May 2026, 11:00', status: 'completed', notes: 'Estate planning initial consult.' },
  { id: 4817, client: 'Amet Holdings', dateTime: '05 May 2026, 13:30', status: 'cancelled', notes: '' },
]

const STATUSES = ['All', 'pending', 'confirmed', 'completed', 'cancelled']

const STATUS_BADGE = {
  pending: 'badge status-pending',
  confirmed: 'badge status-confirmed',
  completed: 'badge status-completed',
  cancelled: 'badge status-cancelled',
}

export default function SessionsTab() {
  const [statusFilter, setStatusFilter] = useState('All')
  // TODO: const { data: sessions = [] } = useGetMySessionsAsConsultantQuery()

  const sessions = PLACEHOLDER_SESSIONS.filter((s) =>
    statusFilter === 'All' ? true : s.status === statusFilter
  )

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>My Sessions</h3>
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
              <th>Client</th>
              <th>Date &amp; Time</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500 }}>{s.client}</td>
                <td style={{ color: 'var(--text-muted)' }}>{s.dateTime}</td>
                <td><span className={STATUS_BADGE[s.status]}>{s.status}</span></td>
                <td style={{ color: 'var(--text-muted)', maxWidth: 240 }}>
                  <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {s.notes || '—'}
                  </span>
                </td>
                <td>
                  {s.status === 'pending' && <button className="btn btn-primary btn-sm">Confirm</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
