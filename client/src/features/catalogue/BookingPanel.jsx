import { useState } from 'react'

const PLACEHOLDER_SLOTS = ['09:00', '10:30', '14:00', '16:30']

export default function BookingPanel({ consultantId, consultantName }) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [notes, setNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  // TODO: replace with useBookSessionMutation
  function handleConfirm() {
    if (!selectedDate || !selectedSlot) return
    // POST /api/sessions
    setConfirmed(true)
  }

  if (confirmed) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
          <p style={{ fontWeight: 600 }}>Session booked!</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Your session has been booked. You'll find it under My Sessions.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 16 }}
            onClick={() => { setConfirmed(false); setSelectedDate(''); setSelectedSlot(null); setNotes('') }}
          >
            Book another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 className="section-title" style={{ marginBottom: 0 }}>Book a session</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>with {consultantName}</p>

      <div className="form-group">
        <label htmlFor="session-date">Date</label>
        <input
          id="session-date"
          type="date"
          value={selectedDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null) }}
        />
      </div>

      {selectedDate && (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>Available slots</div>
          <div className="slot-grid">
            {PLACEHOLDER_SLOTS.map((s) => (
              <button
                key={s}
                className={`slot-pill${selectedSlot === s ? ' selected' : ''}`}
                onClick={() => setSelectedSlot(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="session-notes">Notes (optional)</label>
        <textarea
          id="session-notes"
          placeholder="Add any notes or agenda items for the consultant…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <button
        className="btn btn-primary"
        disabled={!selectedDate || !selectedSlot}
        onClick={handleConfirm}
      >
        Confirm Booking
      </button>
    </div>
  )
}
