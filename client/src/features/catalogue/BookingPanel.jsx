import { useState, useRef, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { PaymentElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js'
import stripePromise from '../../lib/stripe'
import { useGetConsultantSlotsQuery, useCreatePaymentIntentMutation, useUploadDocumentMutation } from './catalogueApi'
import { api } from '../../services/api'
import { useLabels } from '../../lib/useLabels'

const ROMANIAN_COUNTIES = [
  'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani', 'Brașov', 'Brăila', 'Buzău',
  'Caraș-Severin', 'Călărași', 'Cluj', 'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu',
  'Gorj', 'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș', 'Mehedinți', 'Mureș',
  'Neamț', 'Olt', 'Prahova', 'Satu Mare', 'Sălaj', 'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea',
  'Vaslui', 'Vâlcea', 'Vrancea', 'București'
];

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function fmtSlotLabel(slot, durationH) {
  const start = new Date(slot.startTime)
  const end = new Date(start.getTime() + durationH * 60 * 60 * 1000)
  return `${fmtTime(start.toISOString())} – ${fmtTime(end.toISOString())}`
}

function dateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const t = useLabels()
  const fileInputRef = useRef(null)
  
  // Step 1 states (Single-date / Month Calendar view)
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(() => {
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState(30) // 30 | 60 | 90 | 120
  
  // Step 2 modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [billingType, setBillingType] = useState('fizica') // 'fizica' | 'juridica'
  const [billingName, setBillingName] = useState('')
  const [billingCnp, setBillingCnp] = useState('')
  const [billingLocalitate, setBillingLocalitate] = useState('')
  const [billingJudet, setBillingJudet] = useState('')
  const [billingCompanyName, setBillingCompanyName] = useState('')
  const [billingCui, setBillingCui] = useState('')
  const [billingRegCom, setBillingRegCom] = useState('')
  const [billingCompanyAddress, setBillingCompanyAddress] = useState('')
  
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState([])
  
  // Step 3 / response states
  const [clientSecret, setClientSecret] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [intentError, setIntentError] = useState('')
  const [uploadError, setUploadError] = useState('')

  // Derive target start (1st day) and end (last day) dates of currentMonth
  const startDate = dateKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1))
  const endDate = dateKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0))

  const { data: slots = [], isFetching: slotsLoading, error } = useGetConsultantSlotsQuery(
    { consultantId, startDate, endDate },
    { skip: !startDate || !endDate }
  )

  const [createPaymentIntent, { isLoading: creatingIntent }] = useCreatePaymentIntentMutation()
  const [uploadDocument] = useUploadDocumentMutation()

  // Retrieve current active slot object
  const selectedSlot = useMemo(() => {
    return slots.find((s) => s.id === selectedSlotId)
  }, [selectedSlotId, slots])

  // Look-ahead consecutive slots verification logic
  function isSlotAvailableForDuration(slot, durationMin, allSlots) {
    const startMs = new Date(slot.startTime).getTime()
    const stepMs = 30 * 60 * 1000
    const slotsNeeded = durationMin / 30

    // Create a Set of all available slot start times for fast lookup
    const allStartTimes = new Set(allSlots.map(s => new Date(s.startTime).getTime()))

    for (let i = 0; i < slotsNeeded; i++) {
      if (!allStartTimes.has(startMs + i * stepMs)) {
        return false
      }
    }
    return true
  }

  // Filter slots for the selected date that fit the selected duration
  const availableSlotsOnSelectedDate = useMemo(() => {
    if (!selectedDate || slots.length === 0) return []
    return slots.filter((slot) => {
      const slotDateStr = dateKey(new Date(slot.startTime))
      if (slotDateStr !== selectedDate) return false
      
      const isPast = new Date(slot.startTime) < new Date()
      if (isPast) return false

      return isSlotAvailableForDuration(slot, selectedDurationMinutes, slots)
    })
  }, [selectedDate, selectedDurationMinutes, slots])

  // Month navigation handlers
  function handlePrevMonth() {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    setSelectedSlotId(null)
  }

  function handleNextMonth() {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    setSelectedSlotId(null)
  }

  async function handleProceedToPayment() {
    if (!selectedSlotId || !selectedDurationMinutes) return
    setIntentError('')
    setUploadError('')
    
    // Client-side validations
    if (!notes.trim()) {
      setIntentError('Descrierea problemei este obligatorie / Description is required.')
      return
    }
    
    if (billingType === 'fizica') {
      if (!billingName.trim() || !billingLocalitate.trim() || !billingJudet) {
        setIntentError('Numele, localitatea și județul sunt obligatorii pentru persoana fizică.')
        return
      }
    } else {
      if (!billingCompanyName.trim() || !billingCui.trim() || !billingRegCom.trim() || !billingCompanyAddress.trim()) {
        setIntentError('Toate câmpurile firmei sunt obligatorii pentru persoana juridică.')
        return
      }
    }

    try {
      const billingInfo = {
        billingType,
        name: billingType === 'fizica' ? billingName : null,
        cnp: billingType === 'fizica' ? billingCnp || null : null,
        localitate: billingType === 'fizica' ? billingLocalitate : null,
        judet: billingType === 'fizica' ? billingJudet : null,
        companyName: billingType === 'juridica' ? billingCompanyName : null,
        cui: billingType === 'juridica' ? billingCui : null,
        regCom: billingType === 'juridica' ? billingRegCom : null,
        companyAddress: billingType === 'juridica' ? billingCompanyAddress : null,
      }

      const { clientSecret: secret, sessionId } = await createPaymentIntent({
        consultantId,
        slotId: selectedSlotId,
        notes,
        duration: selectedDurationMinutes / 60, // Fractional duration (e.g. 0.5, 1.0, 1.5, 2.0)
        billingInfo,
      }).unwrap()

      if (files.length > 0) {
        const results = await Promise.allSettled(
          files.map((file) => uploadDocument({ sessionId, file }).unwrap())
        )
        const failed = results.filter((r) => r.status === 'rejected')
        if (failed.length > 0) {
          setUploadError(`${failed.length} file(s) failed to upload and were skipped.`)
        }
      }

      setClientSecret(secret)
    } catch (err) {
      setIntentError(err?.data?.error ?? 'Could not initiate payment. Please try again.')
    }
  }

  function handleFileChange(e) {
    const selected = Array.from(e.target.files)
    setFiles((prev) => {
      const combined = [...prev, ...selected].slice(0, 5)
      return combined
    })
    e.target.value = ''
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function handleBack() {
    setClientSecret(null)
    setIntentError('')
    setUploadError('')
  }

  if (confirmed) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
          <p style={{ fontWeight: 600 }}>Plată finalizată cu succes!</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Sesiunea ta a fost confirmată. O poți găsi în secțiunea Sesiunile mele.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 16 }}
            onClick={() => {
              setConfirmed(false)
              const today = new Date()
              setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
              const y = today.getFullYear()
              const m = String(today.getMonth() + 1).padStart(2, '0')
              const d = String(today.getDate()).padStart(2, '0')
              setSelectedDate(`${y}-${m}-${d}`)
              setSelectedSlotId(null)
              setSelectedDurationMinutes(30)
              setNotes('')
              setFiles([])
              setClientSecret(null)
              setIsModalOpen(false)
              setBillingName('')
              setBillingCnp('')
              setBillingLocalitate('')
              setBillingJudet('')
              setBillingCompanyName('')
              setBillingCui('')
              setBillingRegCom('')
              setBillingCompanyAddress('')
            }}
          >
            Rezervă o altă sesiune
          </button>
        </div>
      </div>
    )
  }

  const monthNames = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ]

  const calendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const numDays = lastDay.getDate()
    const firstDayIndex = firstDay.getDay()
    const firstDayOfWeek = firstDayIndex === 0 ? 6 : firstDayIndex - 1

    const blanks = Array(firstDayOfWeek).fill(null)
    const days = Array.from({ length: numDays }, (_, i) => i + 1)

    return [...blanks, ...days]
  }, [currentMonth])

  return (
    <>
      {/* Step 1: Mini-form (Main Component) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>Rezervă o ședință</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>cu {consultantName}</p>

        {/* 1. Unauthorized Warning / Sign in connector */}
        {error?.status === 401 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              {t.bookingPanel?.unauthorizedMsg || 'Trebuie să fii conectat pentru a vedea intervalele disponibile.'}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => navigate('/login', { state: { from: location } })}
            >
              {t.bookingPanel?.connectBtn || 'Conectează-te'}
            </button>
          </div>
        )}

        {error?.status !== 401 && (
          <>
            {/* 2. Session Duration Selector */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                Durată ședință / Duration
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {[
                  { min: 30, label: '30 min' },
                  { min: 60, label: '1 ora' },
                  { min: 90, label: '1.5 ore' },
                  { min: 120, label: '2 ore' }
                ].map(({ min, label }) => {
                  const isSelected = selectedDurationMinutes === min
                  return (
                    <button
                      key={min}
                      type="button"
                      onClick={() => {
                        setSelectedDurationMinutes(min)
                        setSelectedSlotId(null)
                      }}
                      style={{
                        padding: '8px 4px',
                        fontSize: 13,
                        fontWeight: 600,
                        borderRadius: 6,
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--accent-orange)' : 'var(--border, #e4e4e7)',
                        background: isSelected ? 'var(--accent-orange)' : '#fff',
                        color: isSelected ? 'var(--primary-dark)' : 'var(--text-main, #1c1917)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.1s ease'
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3. Month Picker / Calendar view */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Alege o dată / Select date
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '2px 8px', fontSize: 12 }}
                    onClick={handlePrevMonth}
                    disabled={
                      currentMonth.getFullYear() <= today.getFullYear() &&
                      currentMonth.getMonth() <= today.getMonth()
                    }
                  >
                    ←
                  </button>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize', minWidth: 100, textAlign: 'center' }}>
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '2px 8px', fontSize: 12 }}
                    onClick={handleNextMonth}
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div style={{
                border: '1px solid var(--border, #e4e4e7)',
                borderRadius: 8,
                padding: 10,
                background: '#fff'
              }}>
                {/* Weekdays header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 4,
                  marginBottom: 6,
                  textAlign: 'center'
                }}>
                  {['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'].map((day) => (
                    <span key={day} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted, #71717a)' }}>
                      {day}
                    </span>
                  ))}
                </div>

                {/* Grid of days */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 4,
                  textAlign: 'center'
                }}>
                  {slotsLoading ? (
                    <div style={{ gridColumn: 'span 7', padding: '20px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      Se încarcă calendarul…
                    </div>
                  ) : (
                    calendarGrid.map((dayNum, idx) => {
                      if (dayNum === null) {
                        return <div key={`empty-${idx}`} />
                      }

                      const dKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                      const isSelected = selectedDate === dKey

                      // Determine if this day is in the past
                      const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum)
                      const isPastDay = cellDate < today && cellDate.toDateString() !== today.toDateString()

                      // Check if there is any slot for the selected duration on this day
                      const hasAvailableSlots = slots.some((slot) => {
                        const slotDateStr = dateKey(new Date(slot.startTime))
                        if (slotDateStr !== dKey) return false
                        const isPastSlot = new Date(slot.startTime) < today
                        if (isPastSlot) return false
                        return isSlotAvailableForDuration(slot, selectedDurationMinutes, slots)
                      })

                      const isDisabled = isPastDay || !hasAvailableSlots

                      return (
                        <button
                          key={`day-${dayNum}`}
                          type="button"
                          disabled={isDisabled}
                          title={isDisabled ? "Indisponibil" : undefined}
                          onClick={() => {
                            setSelectedDate(dKey)
                            setSelectedSlotId(null)
                          }}
                          style={{
                            width: '30px',
                            height: '30px',
                            margin: 'auto',
                            padding: 0,
                            fontSize: 13,
                            fontWeight: isSelected ? '600' : '500',
                            borderRadius: '50%',
                            border: '1px solid',
                            borderColor: isSelected ? 'var(--accent-orange)' : 'transparent',
                            background: isSelected
                              ? 'var(--accent-orange)'
                              : 'transparent',
                            color: isSelected
                              ? 'var(--primary-dark)'
                              : isDisabled
                              ? 'var(--text-muted, #a1a1aa)'
                              : 'var(--text-main, #18181b)',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            opacity: isDisabled ? 0.35 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {dayNum}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* 4. Available Times List */}
            {selectedDate && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Intervale disponibile / Available times
                </label>
                {slotsLoading ? (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0' }}>
                    Se încarcă orele disponibile…
                  </p>
                ) : availableSlotsOnSelectedDate.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                    Niciun interval de {selectedDurationMinutes} min disponibil / No slots available.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 160, overflowY: 'auto', paddingRight: 4 }}>
                    {availableSlotsOnSelectedDate.map((s) => {
                      const startStr = new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      const endStr = new Date(new Date(s.startTime).getTime() + selectedDurationMinutes * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      
                      const isSelected = selectedSlotId === s.id
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSlotId(s.id)}
                          style={{
                            padding: '6px 10px',
                            fontSize: 13,
                            fontWeight: isSelected ? '600' : '500',
                            borderRadius: 6,
                            border: '1px solid',
                            borderColor: isSelected ? 'var(--accent-orange)' : 'var(--border, #e4e4e7)',
                            background: isSelected ? 'var(--accent-orange)' : '#fff',
                            color: isSelected ? 'var(--primary-dark)' : 'var(--text-main)',
                            cursor: 'pointer',
                            transition: 'all 0.1s ease'
                          }}
                        >
                          {startStr} – {endStr}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {error?.status !== 401 && (
          <>
            {selectedSlotId && selectedDurationMinutes && (() => {
              const startVal = new Date(selectedSlot.startTime)
              const [y, m, d] = selectedDate.split('-')
              const fmtDate = `${d}.${m}.${y}`
              const startStr = startVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              const durationMapping = {
                30: '30 min',
                60: '1 ora',
                90: '1.5 ore',
                120: '2 ore'
              }
              const fmtDuration = durationMapping[selectedDurationMinutes] || `${selectedDurationMinutes} min`
              return (
                <div style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-main, #1c1917)',
                  background: 'var(--grey-bg, #f1f5f9)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #e2e8f0)',
                  textAlign: 'center',
                  marginTop: 4,
                  lineHeight: '1.4'
                }}>
                  Rezervare făcută în {fmtDate}, ora {startStr}, pentru {fmtDuration}.
                </div>
              )
            })()}

            <button
              className="btn btn-primary"
              style={{ marginTop: 8 }}
              disabled={!selectedSlotId || !selectedDurationMinutes}
              onClick={() => setIsModalOpen(true)}
            >
              Continuă / Next Step
            </button>
          </>
        )}
      </div>

      {/* Step 2 & 3: Full-width Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          overflowY: 'auto'
        }}>
          <div className="card" style={{
            maxWidth: '700px',
            width: '100%',
            padding: '30px',
            boxShadow: '0 20px 48px rgba(0,0,0,0.15)',
            background: '#fff',
            maxHeight: '100%',
            overflowY: 'auto',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            position: 'relative'
          }}>
            {/* Modal Heading */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f4f4f5', paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                {clientSecret ? 'Pasul 3: Plată / Payment' : 'Pasul 2: Date Facturare & Detalii / Information'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (!creatingIntent) {
                    setIsModalOpen(false)
                  }
                }}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)' }}
                disabled={creatingIntent}
              >
                ×
              </button>
            </div>

            {clientSecret ? (
              /* Step 3: Stripe Payment flow */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  Completați plata cu cardul pentru a confirma sesiunea de consultanță cu {consultantName}.
                </p>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm
                    clientSecret={clientSecret}
                    onSuccess={() => {
                      dispatch(api.util.invalidateTags(['Session', 'Slot']))
                      setConfirmed(true)
                      setIsModalOpen(false)
                    }}
                    onCancel={handleBack}
                  />
                </Elements>
              </div>
            ) : (
              /* Step 2: Information form */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                
                {/* Billing Info Entity Type */}
                <div className="form-group">
                  <label style={{ fontWeight: 500, fontSize: 14, marginBottom: 8, display: 'block' }}>
                    Tip Facturare / Billing Type <span style={{ color: 'var(--red, #ef4444)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="button"
                      className={`slot-pill${billingType === 'fizica' ? ' selected' : ''}`}
                      style={{ flex: 1, padding: '10px 16px', fontWeight: 500 }}
                      onClick={() => setBillingType('fizica')}
                    >
                      Persoană Fizică
                    </button>
                    <button
                      type="button"
                      className={`slot-pill${billingType === 'juridica' ? ' selected' : ''}`}
                      style={{ flex: 1, padding: '10px 16px', fontWeight: 500 }}
                      onClick={() => setBillingType('juridica')}
                    >
                      Persoană Juridică
                    </button>
                  </div>
                </div>

                {/* Billing Info Fields */}
                {billingType === 'fizica' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="form-group">
                      <label htmlFor="billing-name">Nume complet / Full Name <span style={{ color: 'var(--red, #ef4444)' }}>*</span></label>
                      <input
                        id="billing-name"
                        type="text"
                        placeholder="Popescu Ion"
                        value={billingName}
                        onChange={(e) => setBillingName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label htmlFor="billing-cnp">CNP (Opțional)</label>
                        <input
                          id="billing-cnp"
                          type="text"
                          placeholder="1900101..."
                          value={billingCnp}
                          onChange={(e) => setBillingCnp(e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="billing-judet">Județ <span style={{ color: 'var(--red, #ef4444)' }}>*</span></label>
                        <select
                          id="billing-judet"
                          value={billingJudet}
                          onChange={(e) => setBillingJudet(e.target.value)}
                          required
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border, #e4e4e7)' }}
                        >
                          <option value="">Alege județ...</option>
                          {ROMANIAN_COUNTIES.map((county) => (
                            <option key={county} value={county}>{county}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="billing-localitate">Localitate / City <span style={{ color: 'var(--red, #ef4444)' }}>*</span></label>
                      <input
                        id="billing-localitate"
                        type="text"
                        placeholder="Cluj-Napoca"
                        value={billingLocalitate}
                        onChange={(e) => setBillingLocalitate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="form-group">
                      <label htmlFor="billing-company-name">Denumire Companie / Company Name <span style={{ color: 'var(--red, #ef4444)' }}>*</span></label>
                      <input
                        id="billing-company-name"
                        type="text"
                        placeholder="S.C. Exemplu S.R.L."
                        value={billingCompanyName}
                        onChange={(e) => setBillingCompanyName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label htmlFor="billing-cui">CUI / CIF <span style={{ color: 'var(--red, #ef4444)' }}>*</span></label>
                        <input
                          id="billing-cui"
                          type="text"
                          placeholder="RO12345678"
                          value={billingCui}
                          onChange={(e) => setBillingCui(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="billing-reg-com">Reg. Comertului <span style={{ color: 'var(--red, #ef4444)' }}>*</span></label>
                        <input
                          id="billing-reg-com"
                          type="text"
                          placeholder="J40/123/2020"
                          value={billingRegCom}
                          onChange={(e) => setBillingRegCom(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="billing-company-address">Adresă Sediu Social / Headquarters Address <span style={{ color: 'var(--red, #ef4444)' }}>*</span></label>
                      <input
                        id="billing-company-address"
                        type="text"
                        placeholder="Str. Comerțului Nr. 5, București"
                        value={billingCompanyAddress}
                        onChange={(e) => setBillingCompanyAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Describe the problem Field */}
                <div className="form-group">
                  <label htmlFor="session-notes">Descrieți problema / Describe the problem <span style={{ color: 'var(--red, #ef4444)' }}>*</span></label>
                  <textarea
                    id="session-notes"
                    placeholder="Vă rugăm să descrieți problema sau întrebările pentru care solicitați consultanță, astfel încât consultantul să se poată pregăti în avans..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                {/* Document Attachments */}
                <div className="form-group">
                  <label>Atașamente / Attachments (opțional)</label>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, marginTop: 2 }}>
                    PDF, Word, Excel, or images — up to 5 files, 10 MB each
                  </p>
                  {files.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {files.map((f, i) => (
                        <li
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: 13,
                            background: 'var(--surface-2, #f4f4f5)',
                            borderRadius: 6,
                            padding: '4px 8px',
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                            {f.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1 }}
                            aria-label={`Remove ${f.name}`}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {files.length < 5 && (
                    <>
                      <input
                        ref={fileInputRef}
                        id="session-files"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        + Add file
                      </button>
                    </>
                  )}
                </div>

                {intentError && (
                  <p style={{ fontSize: 13, color: 'var(--red, #ef4444)', margin: 0 }}>{intentError}</p>
                )}
                {uploadError && (
                  <p style={{ fontSize: 13, color: 'var(--yellow, #f59e0b)', margin: 0 }}>{uploadError}</p>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 12, borderTop: '1px solid #f4f4f5', paddingTop: 18 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setIsModalOpen(false)}
                    disabled={creatingIntent}
                  >
                    Înapoi / Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 2 }}
                    disabled={creatingIntent || !notes.trim() || (billingType === 'fizica' ? (!billingName.trim() || !billingLocalitate.trim() || !billingJudet) : (!billingCompanyName.trim() || !billingCui.trim() || !billingRegCom.trim() || !billingCompanyAddress.trim()))}
                    onClick={handleProceedToPayment}
                  >
                    {creatingIntent
                      ? files.length > 0
                        ? 'Uploading…'
                        : 'Preparing payment…'
                      : 'Plata cu cardul'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
