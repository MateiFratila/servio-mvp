import { useGetMySessionsAsClientQuery, useCancelSessionMutation } from './catalogueApi'
import { useNavigate } from 'react-router-dom'

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_BADGE = {
  pending: 'badge status-pending',
  confirmed: 'badge status-confirmed',
  completed: 'badge status-completed',
  cancelled: 'badge status-cancelled',
}

export default function MySessionsPanel() {
  const { data, isLoading, refetch, isFetching } = useGetMySessionsAsClientQuery()
  const [cancelSession, { isLoading: cancelling }] = useCancelSessionMutation()
  const navigate = useNavigate()
  const sessions = data?.data ?? []

  // True when at least one confirmed session has no room yet
  const hasPendingRoom = sessions.some((s) => s.status === 'confirmed' && !s.meetingUrl)

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>My Sessions</h3>
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
      </div>
      {isLoading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</p>
      ) : sessions.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No sessions yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Consultant</th>
                <th>Date &amp; Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>{s.consultant?.displayName ?? '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{fmtDateTime(s.slot?.startTime)}</td>
                  <td><span className={STATUS_BADGE[s.status]}>{s.status}</span></td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {s.status === 'confirmed' && !s.meetingUrl && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Setting up room…
                      </span>
                    )}
                    {s.status === 'confirmed' && s.meetingUrl && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/meeting/${s.id}`)}
                      >
                        Join
                      </button>
                    )}
                    {(s.status === 'pending' || s.status === 'confirmed') && (
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={cancelling}
                        onClick={() => cancelSession(s.id)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
