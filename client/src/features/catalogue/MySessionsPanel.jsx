import { useGetMySessionsAsClientQuery, useCancelSessionMutation } from './catalogueApi'

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
  const { data, isLoading } = useGetMySessionsAsClientQuery()
  const [cancelSession, { isLoading: cancelling }] = useCancelSessionMutation()
  const sessions = data?.data ?? []

  return (
    <div className="card">
      <h3 className="section-title">My Sessions</h3>
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
                  <td>
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
