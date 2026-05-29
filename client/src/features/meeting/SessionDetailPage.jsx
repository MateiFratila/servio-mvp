import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useGetSessionQuery, useGetSessionDocumentsQuery, useCancelSessionMutation, useGetSessionMessagesQuery, useContactClientMutation } from '../catalogue/catalogueApi'
import { useUpdateSessionStatusMutation } from '../dashboard/dashboardApi'
import { selectCurrentToken, selectCurrentRole, selectCurrentUser } from '../auth/authSlice'

function ConfirmModal({ message, onConfirm, onClose, loading, confirmLabel = 'Confirm', confirmCls = 'btn btn-danger' }) {
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
          <button className={confirmCls} onClick={onConfirm} disabled={loading}>
            {loading ? 'Loading…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

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

function buildGoogleCalendarUrl(session) {
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Session with ${session.consultant?.displayName ?? 'Consultant'}`,
    dates: `${fmt(new Date(session.slot.startTime))}/${fmt(new Date(session.slot.endTime))}`,
    details: session.notes ?? '',
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

function downloadIcs(session) {
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const summary = `Session with ${session.consultant?.displayName ?? 'Consultant'}`
  const description = (session.notes ?? '').replace(/\n/g, '\\n')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Servio//Session//EN',
    'BEGIN:VEVENT',
    `UID:session-${session.id}@servio`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(new Date(session.slot.startTime))}`,
    `DTEND:${fmt(new Date(session.slot.endTime))}`,
    `SUMMARY:${summary}`,
  ]
  if (description) lines.push(`DESCRIPTION:${description}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `session-${session.id}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

const STATUS_LABEL = {
  pending:              { label: 'Awaiting payment',        cls: 'badge status-pending' },
  pending_confirmation: { label: 'Pending confirmation',    cls: 'badge status-pending' },
  ping_pong:            { label: 'Info requested',          cls: 'badge status-pending' },
  confirmed:            { label: 'Confirmed',               cls: 'badge status-confirmed' },
  completed:            { label: 'Completed',               cls: 'badge status-completed' },
  cancelled:            { label: 'Cancelled',               cls: 'badge status-cancelled' },
}

const STATUS_TOOLTIP = {
  pending:              'Payment in progress.',
  pending_confirmation: 'Payment received. Waiting for the consultant to confirm the session.',
  ping_pong:            'The consultant has requested additional information or documents.',
  confirmed:            'The consultant has confirmed. Your session is locked in.',
  completed:            'The session has ended successfully.',
  cancelled:            'This session was cancelled.',
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
  const { data: messages = [] } = useGetSessionMessagesQuery(sessionId)
  const [cancelSession, { isLoading: cancelling }] = useCancelSessionMutation()
  const [updateStatus, { isLoading: confirming }] = useUpdateSessionStatusMutation()
  const [contactClient, { isLoading: contacting }] = useContactClientMutation()
  const role = useSelector(selectCurrentRole)
  const currentUser = useSelector(selectCurrentUser)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactContent, setContactContent] = useState('')
  const [contactFile, setContactFile] = useState(null)
  const [contactError, setContactError] = useState(null)
  const fileInputRef = useRef(null)

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
    if (role === 'consultant' || role === 'admin') {
      await updateStatus({ id: session.id, status: 'cancelled' })
    } else {
      await cancelSession(sessionId)
    }
    setShowCancelModal(false)
    navigate(-1)
  }

  async function handleContactSubmit() {
    setContactError(null)
    if (!contactContent.trim() && !contactFile) {
      setContactError('Please enter a message or attach a file.')
      return
    }
    try {
      await contactClient({ sessionId: session.id, content: contactContent.trim(), file: contactFile || undefined }).unwrap()
      setShowContactModal(false)
      setContactContent('')
      setContactFile(null)
    } catch (err) {
      setContactError(err?.data?.error ?? 'Something went wrong.')
    }
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

  const canCancel = session.status === 'pending' || session.status === 'pending_confirmation'
  const canJoin = session.status === 'confirmed' && session.meetingUrl
  const canConfirm = (role === 'consultant' || role === 'admin') &&
    (session.status === 'pending_confirmation' || session.status === 'ping_pong')
  const canContactClient = (role === 'consultant' || role === 'admin' || role === 'client') &&
    (session.status === 'pending_confirmation' || session.status === 'ping_pong' || session.status === 'confirmed')

  const isClientBooker = session?.clientId === currentUser?.id
  const startPassed = session?.slot?.startTime ? (new Date() > new Date(session.slot.startTime)) : false
  const hasReview = !!session?.review
  const canLeaveReview = isClientBooker && (startPassed || hasReview)

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 720 }}>
      {showConfirmModal && (
        <ConfirmModal
          message="This will confirm the session and lock it in for the client. Are you sure?"
          loading={confirming}
          confirmLabel="Yes, confirm session"
          confirmCls="btn btn-primary"
          onConfirm={async () => {
            await updateStatus({ id: session.id, status: 'confirmed' })
            setShowConfirmModal(false)
          }}
          onClose={() => setShowConfirmModal(false)}
        />
      )}

      {showCancelModal && (
        <ConfirmModal
          message="This will cancel the session and release the time slot. This action cannot be undone."
          loading={cancelling || confirming}
          confirmLabel="Yes, cancel session"
          onConfirm={handleCancel}
          onClose={() => setShowCancelModal(false)}
        />
      )}

      {showContactModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="card" style={{ maxWidth: 480, width: '90%', padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Request Additional Info</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
              Send a message or attach a file. The session will enter <strong>Info Requested</strong> state.
            </p>
            <textarea
              rows={4}
              placeholder="Your message…"
              value={contactContent}
              onChange={(e) => setContactContent(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', fontSize: 14,
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                resize: 'vertical', fontFamily: 'inherit',
                background: 'var(--surface)', color: 'var(--text)',
              }}
            />
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Attachment (optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                onChange={(e) => setContactFile(e.target.files[0] ?? null)}
                style={{ fontSize: 13 }}
              />
              {contactFile && (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 6 }}
                  onClick={() => { setContactFile(null); fileInputRef.current.value = '' }}
                >
                  Remove
                </button>
              )}
            </div>
            {contactError && (
              <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 10 }}>{contactError}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button
                className="btn btn-secondary"
                onClick={() => { setShowContactModal(false); setContactContent(''); setContactFile(null); setContactError(null) }}
                disabled={contacting}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleContactSubmit} disabled={contacting}>
                {contacting ? 'Sending…' : 'Send & Request Info'}
              </button>
            </div>
          </div>
        </div>
      )}
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

        {session.slot?.startTime && (
          <div style={{ display: 'flex', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <a
              href={buildGoogleCalendarUrl(session)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="15" height="15" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
                <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
                <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
                <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
              </svg>
              Google Calendar
            </a>
            <button
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => downloadIcs(session)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
              Apple Calendar
            </button>
            {canLeaveReview && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/sessions/${session.id}/review`)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                ★ {session.review ? 'Vizualizează recenzia' : 'Lasă o Recenzie'}
              </button>
            )}
          </div>
        )}
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

      {messages.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Messages</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg) => (
              <li
                key={msg.id}
                style={{
                  padding: '12px 14px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {msg.author?.role ?? '—'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                {msg.attachmentFilename && (
                  <a
                    href={`/api/sessions/${sessionId}/messages/${msg.id}/download`}
                    style={{ display: 'inline-block', marginTop: 8, fontSize: 13, color: 'var(--primary)' }}
                  >
                    📎 {msg.attachmentFilename}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(canConfirm || canContactClient || canCancel) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {canConfirm && (
            <button
              className="btn btn-primary"
              disabled={confirming}
              onClick={() => setShowConfirmModal(true)}
            >
              Confirm Session
            </button>
          )}
          {canContactClient && (
            <button
              className="btn btn-secondary"
              onClick={() => { setContactError(null); setShowContactModal(true) }}
            >
              Request Additional Info
            </button>
          )}
          {canCancel && (
            <button
              className="btn btn-danger"
              disabled={cancelling || confirming}
              onClick={() => setShowCancelModal(true)}
            >
              Cancel Session
            </button>
          )}
        </div>
      )}
    </div>
  )
}
