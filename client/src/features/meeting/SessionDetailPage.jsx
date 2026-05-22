import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useGetSessionQuery, useGetSessionDocumentsQuery, useCancelSessionMutation } from '../catalogue/catalogueApi'
import { selectCurrentToken } from '../auth/authSlice'

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtTime(startIso, endIso) {
  const start = new Date(startIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const end = new Date(endIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${start} – ${end}`
}

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const STATUS_LABEL = {
  pending:    { label: 'Pending confirmation', cls: 'badge status-pending' },
  confirmed:  { label: 'Confirmed',            cls: 'badge status-confirmed' },
  completed:  { label: 'Completed',            cls: 'badge status-completed' },
  cancelled:  { label: 'Cancelled',            cls: 'badge status-cancelled' },
}

const STATUS_TOOLTIP = {
  pending:   'Payment received. Waiting for the consultant to confirm the session.',
  confirmed: 'The consultant has confirmed. Your session is locked in.',
  completed: 'The session has ended successfully.',
  cancelled: 'This session was cancelled.',
}

function StatusBadge({ status }) {
  const [visible, setVisible] = useState(false)
  const info = STATUS_LABEL[status] ?? { label: status, cls: 'badge' }
  const tip = STATUS_TOOLTIP[status]
  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className={info.cls} style={{ cursor: 'help' }}>{info.label}</span>
      {visible && tip && (
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
          {tip}
        </span>
      )}
    </span>
  )
}

export default function SessionDetailPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const token = useSelector(selectCurrentToken)

  const { data: session, isLoading, error } = useGetSessionQuery(sessionId)
  const { data: docs = [], isLoading: docsLoading } = useGetSessionDocumentsQuery(sessionId)
  const [cancelSession, { isLoading: cancelling }] = useCancelSessionMutation()

  async function handleDownload(doc) {
    const res = await fetch(`/api/sessions/${sessionId}/documents/${doc.id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCancel() {
    if (!window.confirm('Cancel this session? This cannot be undone.')) return
    await cancelSession(sessionId)
    navigate(-1)
  }

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <p style={{ color: 'var(--red)' }}>Session not found.</p>
        <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
    )
  }

  const canCancel = session.status === 'pending' || session.status === 'confirmed'
  const canJoin = session.status === 'confirmed' && session.meetingUrl

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 720 }}>
      <button
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: 20 }}
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Meeting Details</h2>
          <StatusBadge status={session.status} />
        </div>

        <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px 0', fontSize: 14 }}>
          <dt style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Consultant</dt>
          <dd style={{ fontWeight: 500 }}>{session.consultant?.displayName ?? '—'}</dd>

          <dt style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Date</dt>
          <dd>{session.slot?.startTime ? fmtDate(session.slot.startTime) : '—'}</dd>

          <dt style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Time</dt>
          <dd>{session.slot?.startTime && session.slot?.endTime ? fmtTime(session.slot.startTime, session.slot.endTime) : '—'}</dd>

          {session.notes && (
            <>
              <dt style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Notes</dt>
              <dd style={{ whiteSpace: 'pre-wrap' }}>{session.notes}</dd>
            </>
          )}

          <dt style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Meeting link</dt>
          <dd>
            {canJoin ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/meeting/${session.id}`)}
              >
                Join Meeting
              </button>
            ) : session.status === 'confirmed' && !session.meetingUrl ? (
              <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Setting up room…</span>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Not available</span>
            )}
          </dd>
        </dl>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Documents</h3>
        {docsLoading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading documents…</p>
        ) : docs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No documents uploaded.</p>
        ) : (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docs.map((doc) => (
              <li
                key={doc.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: 14,
                }}
              >
                <div>
                  <span style={{ fontWeight: 500 }}>{doc.filename}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{fmtSize(doc.sizeBytes)}</span>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDownload(doc)}
                >
                  Download
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canCancel && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-danger"
            disabled={cancelling}
            onClick={handleCancel}
          >
            {cancelling ? 'Cancelling…' : 'Cancel Session'}
          </button>
        </div>
      )}
    </div>
  )
}
