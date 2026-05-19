import { useState } from 'react'
import { useGetMySessionsAsConsultantQuery, useUpdateSessionStatusMutation } from './dashboardApi'

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUSES = ['All', 'pending', 'confirmed', 'completed', 'cancelled']

const STATUS_BADGE = {
  pending: 'badge status-pending',
  confirmed: 'badge status-confirmed',
  completed: 'badge status-completed',
  cancelled: 'badge status-cancelled',
}

export default function SessionsTab() {
  const [statusFilter, setStatusFilter] = useState('All')
  const { data, isLoading } = useGetMySessionsAsConsultantQuery()
  const [updateStatus] = useUpdateSessionStatusMutation()

  const allSessions = data?.data ?? []
  const sessions = statusFilter === 'All' ? allSessions : allSessions.filter((s) => s.status === statusFilter)

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

      {isLoading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</p>
      ) : (
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
                  <td style={{ fontWeight: 500 }}>{s.client?.email ?? '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{fmtDateTime(s.slot?.startTime)}</td>
                  <td><span className={STATUS_BADGE[s.status]}>{s.status}</span></td>
                  <td style={{ color: 'var(--text-muted)', maxWidth: 240 }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {s.notes || '—'}
                    </span>
                  </td>
                  <td>
                    {s.status === 'pending' && (
                      <button className="btn btn-primary btn-sm" onClick={() => updateStatus({ id: s.id, status: 'confirmed' })}>
                        Confirm
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No sessions.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
