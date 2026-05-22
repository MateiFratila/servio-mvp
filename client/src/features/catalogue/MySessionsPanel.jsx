import { useState } from 'react'
import { useGetMySessionsAsClientQuery, useCancelSessionMutation } from './catalogueApi'
import { useNavigate } from 'react-router-dom'

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_META = {
  pending:              { label: 'Awaiting payment',     cls: 'badge status-pending',    tip: 'Payment in progress.' },
  pending_confirmation: { label: 'Pending confirmation', cls: 'badge status-pending',    tip: 'Payment received. Waiting for the consultant to confirm your session.' },
  confirmed:            { label: 'Confirmed',            cls: 'badge status-confirmed',  tip: 'The consultant has confirmed. Your session is locked in.' },
  completed:            { label: 'Completed',            cls: 'badge status-completed',  tip: 'The session has ended successfully.' },
  cancelled:            { label: 'Cancelled',            cls: 'badge status-cancelled',  tip: 'This session was cancelled.' },
}

function StatusBadge({ status }) {
  const [visible, setVisible] = useState(false)
  const meta = STATUS_META[status] ?? { label: status, cls: 'badge', tip: null }
  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className={meta.cls} style={{ cursor: meta.tip ? 'help' : 'default' }}>{meta.label}</span>
      {visible && meta.tip && (
        <span style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          right: 0,
          background: '#1e293b',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: 6,
          fontSize: 12,
          lineHeight: 1.5,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}>
          {meta.tip}
        </span>
      )}
    </span>
  )
}

function ConfirmModal({ message, onConfirm, onClose, loading }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="card" style={{ maxWidth: 400, width: '90%', padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Are you sure?</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Go back</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Cancelling…' : 'Yes, cancel session'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MySessionsPanel() {
  const { data, isLoading, refetch, isFetching } = useGetMySessionsAsClientQuery()
  const [cancelSession, { isLoading: cancelling }] = useCancelSessionMutation()
  const navigate = useNavigate()
  const sessions = data?.data ?? []
  const [cancelTarget, setCancelTarget] = useState(null)

  async function handleCancel() {
    await cancelSession(cancelTarget)
    setCancelTarget(null)
  }

  // True when at least one confirmed session has no room yet
  const hasPendingRoom = sessions.some((s) => (s.status === 'pending_confirmation' || s.status === 'confirmed') && !s.meetingUrl)

  return (
    <div className="card">
      {cancelTarget && (
        <ConfirmModal
          message="This will cancel the session and release the time slot. This action cannot be undone."
          loading={cancelling}
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
        />
      )}
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
                  <td><StatusBadge status={s.status} /></td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/sessions/${s.id}`)}
                    >
                      See Details
                    </button>
                    {(s.status === 'pending_confirmation' || s.status === 'confirmed') && !s.meetingUrl && (
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
                    {(s.status === 'pending' || s.status === 'pending_confirmation') && (
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={cancelling}
                        onClick={() => setCancelTarget(s.id)}
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
