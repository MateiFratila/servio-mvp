import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetMySessionsAsConsultantQuery, useUpdateSessionStatusMutation } from './dashboardApi'

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUSES = ['All', 'pending', 'pending_confirmation', 'confirmed', 'completed', 'cancelled']

const STATUS_BADGE = {
  pending: 'badge status-pending',
  pending_confirmation: 'badge status-pending',
  confirmed: 'badge status-confirmed',
  completed: 'badge status-completed',
  cancelled: 'badge status-cancelled',
}

const STATUS_LABEL = {
  pending: 'Awaiting payment',
  pending_confirmation: 'Pending confirmation',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function SessionsTab() {
  const [statusFilter, setStatusFilter] = useState('All')
  const { data, isLoading, refetch, isFetching } = useGetMySessionsAsConsultantQuery()
  const [updateStatus] = useUpdateSessionStatusMutation()
  const navigate = useNavigate()

  const allSessions = data?.data ?? []
  const sessions = statusFilter === 'All' ? allSessions : allSessions.filter((s) => s.status === statusFilter)
  const hasPendingRoom = allSessions.some((s) => (s.status === 'pending_confirmation' || s.status === 'confirmed') && !s.meetingUrl)

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>My Sessions</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {hasPendingRoom && (
            <button
              className="btn btn-secondary btn-sm"
              disabled={isFetching}
              onClick={refetch}
              title="Refresh to check if meeting room is ready"
            >
              {isFetching ? 'Checking…' : '↻ Refresh'}
            </button>
          )}
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
                  <td><span className={STATUS_BADGE[s.status]}>{STATUS_LABEL[s.status] ?? s.status}</span></td>
                  <td style={{ color: 'var(--text-muted)', maxWidth: 240 }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {s.notes || '—'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/sessions/${s.id}`)}>See Details</button>
                    {s.status === 'pending_confirmation' && (
                      <button className="btn btn-primary btn-sm" onClick={() => updateStatus({ id: s.id, status: 'confirmed' })}>
                        Confirm
                      </button>
                    )}
                    {s.status === 'confirmed' && !s.meetingUrl && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Setting up room…
                      </span>
                    )}
                    {s.status === 'confirmed' && s.meetingUrl && (
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/meeting/${s.id}`)}>
                        Join
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
