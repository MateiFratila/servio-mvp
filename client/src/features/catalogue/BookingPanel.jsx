import { useState } from 'react'
import { useGetConsultantSlotsQuery, useBookSessionMutation } from './catalogueApi'

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function BookingPanel({ consultantId, consultantName }) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [notes, setNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [bookError, setBookError] = useState('')

  const { data: slots = [], isFetching: slotsLoading } = useGetConsultantSlotsQuery(
    { consultantId, date: selectedDate },
    { skip: !selectedDate }
  )

  const [bookSession, { isLoading: booking }] = useBookSessionMutation()

  async function handleConfirm() {
    if (!selectedSlotId) return
    setBookError('')
    try {
      await bookSession({ consultantId, slotId: selectedSlotId, notes }).unwrap()
      setConfirmed(true)
    } catch (err) {
      setBookError(err?.data?.error ?? 'Booking failed. Please try again.')
    }
  }

  function handleDateChange(value) {
    setSelectedDate(value)
    setSelectedSlotId(null)
    setBookError('')
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
            onClick={() => { setConfirmed(false); setSelectedDate(''); setSelectedSlotId(null); setNotes('') }}
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

      {/* Date picker */}
      <div className="form-group">
        <label htmlFor="session-date">Date</label>
        <input
          id="session-date"
          type="date"
          value={selectedDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => handleDateChange(e.target.value)}
        />
      </div>

      {/* Available slots */}
      {selectedDate && (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>Available times</div>
          {slotsLoading ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading slots…</p>
          ) : slots.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No available slots on this date.</p>
          ) : (
            <div className="slot-grid">
              {slots.map((slot) => {
                const label = `${fmtTime(slot.startTime)} – ${fmtTime(slot.endTime)}`
                return (
                  <button
                    key={slot.id}
                    className={`slot-pill${selectedSlotId === slot.id ? ' selected' : ''}`}
                    onClick={() => setSelectedSlotId(slot.id)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
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

      {bookError && (
        <p style={{ fontSize: 13, color: 'var(--red, #ef4444)' }}>{bookError}</p>
      )}

      <button
        className="btn btn-primary"
        disabled={!selectedDate || !selectedSlotId || booking}
        onClick={handleConfirm}
      >
        {booking ? 'Booking…' : 'Confirm Booking'}
      </button>
    </div>
  )
}
