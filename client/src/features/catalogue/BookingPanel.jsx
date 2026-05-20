import { useState } from 'react'
import { PaymentElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js'
import stripePromise from '../../lib/stripe'
import { useGetConsultantSlotsQuery, useCreatePaymentIntentMutation } from './catalogueApi'

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Inner form rendered inside <Elements> once we have a clientSecret
function PaymentForm({ clientSecret, onSuccess, onCancel }) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  async function handlePay(e) {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    setPayError('')
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })
    if (error) {
      setPayError(error.message)
      setPaying(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PaymentElement />
      {payError && (
        <p style={{ fontSize: 13, color: 'var(--red, #ef4444)' }}>{payError}</p>
      )}
      <button className="btn btn-primary" type="submit" disabled={!stripe || paying}>
        {paying ? 'Processing…' : 'Pay & Confirm'}
      </button>
      <button className="btn btn-secondary btn-sm" type="button" onClick={onCancel} disabled={paying}>
        Back
      </button>
    </form>
  )
}

export default function BookingPanel({ consultantId, consultantName }) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [notes, setNotes] = useState('')
  const [clientSecret, setClientSecret] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [intentError, setIntentError] = useState('')

  const { data: slots = [], isFetching: slotsLoading } = useGetConsultantSlotsQuery(
    { consultantId, date: selectedDate },
    { skip: !selectedDate }
  )

  const [createPaymentIntent, { isLoading: creatingIntent }] = useCreatePaymentIntentMutation()

  async function handleProceedToPayment() {
    if (!selectedSlotId) return
    setIntentError('')
    try {
      const { clientSecret: secret } = await createPaymentIntent({
        consultantId,
        slotId: selectedSlotId,
        notes,
      }).unwrap()
      setClientSecret(secret)
    } catch (err) {
      setIntentError(err?.data?.error ?? 'Could not initiate payment. Please try again.')
    }
  }

  function handleDateChange(value) {
    setSelectedDate(value)
    setSelectedSlotId(null)
    setIntentError('')
    setClientSecret(null)
  }

  function handleBack() {
    setClientSecret(null)
    setIntentError('')
  }

  if (confirmed) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
          <p style={{ fontWeight: 600 }}>Payment successful!</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Your session is confirmed. You'll find it under My Sessions.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 16 }}
            onClick={() => {
              setConfirmed(false)
              setSelectedDate('')
              setSelectedSlotId(null)
              setNotes('')
              setClientSecret(null)
            }}
          >
            Book another
          </button>
        </div>
      </div>
    )
  }

  // Step 2: Payment
  if (clientSecret) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>Payment</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>with {consultantName}</p>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            clientSecret={clientSecret}
            onSuccess={() => setConfirmed(true)}
            onCancel={handleBack}
          />
        </Elements>
      </div>
    )
  }

  // Step 1: Slot selection
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

      {intentError && (
        <p style={{ fontSize: 13, color: 'var(--red, #ef4444)' }}>{intentError}</p>
      )}

      <button
        className="btn btn-primary"
        disabled={!selectedDate || !selectedSlotId || creatingIntent}
        onClick={handleProceedToPayment}
      >
        {creatingIntent ? 'Preparing payment…' : 'Continue to Payment'}
      </button>
    </div>
  )
}
