import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetMySessionsAsConsultantQuery, useUpdateSessionStatusMutation } from './dashboardApi'
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

export default function SessionsTab() {
  const [statusFilter, setStatusFilter] = useState('All')
  const { data, isLoading, refetch, isFetching } = useGetMySessionsAsConsultantQuery()
  const [updateStatus] = useUpdateSessionStatusMutation()
  const navigate = useNavigate()
  const t = useLabels()

  const STATUSES = [t.sessionsTab.filterAll, 'pending', 'pending_confirmation', 'confirmed', 'completed', 'cancelled']

  const allSessions = data?.data ?? []
  const sessions = statusFilter === t.sessionsTab.filterAll ? allSessions : allSessions.filter((s) => s.status === statusFilter)
  const hasPendingRoom = allSessions.some((s) => (s.status === 'pending_confirmation' || s.status === 'confirmed') && !s.meetingUrl)

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>{t.sessionsTab.title}</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {hasPendingRoom && (
            <button
              className="btn btn-secondary btn-sm"
              disabled={isFetching}
              onClick={refetch}
              title="Refresh to check if meeting room is ready"
            >
              {isFetching ? t.sessionsTab.checking : t.sessionsTab.refresh}
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
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t.sessionsTab.loading}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t.sessionsTab.columns.client}</th>
                <th>{t.sessionsTab.columns.dateTime}</th>
                <th>{t.sessionsTab.columns.status}</th>
                <th>{t.sessionsTab.columns.notes}</th>
                <th>{t.sessionsTab.columns.actions}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>{s.client?.email ?? '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{fmtDateTime(s.slot?.startTime)}</td>
                  <td><span className={STATUS_BADGE[s.status]}>{t.statusLabels[s.status] ?? s.status}</span></td>
                  <td style={{ color: 'var(--text-muted)', maxWidth: 240 }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {s.notes || '—'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/sessions/${s.id}`)}>{t.sessionsTab.seeDetails}</button>
                    {s.status === 'pending_confirmation' && (
                      <button className="btn btn-primary btn-sm" onClick={() => updateStatus({ id: s.id, status: 'confirmed' })}>
                        {t.sessionsTab.confirm}
                      </button>
                    )}
                    {s.status === 'confirmed' && !s.meetingUrl && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {t.sessionsTab.settingUpRoom}
                      </span>
                    )}
                    {s.status === 'confirmed' && s.meetingUrl && (
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/meeting/${s.id}`)}>
                        {t.sessionsTab.join}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>{t.sessionsTab.noSessions}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
