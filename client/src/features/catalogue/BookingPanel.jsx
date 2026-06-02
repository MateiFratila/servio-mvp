import { useState, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
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
  const t = useLabels()
  const fileInputRef = useRef(null)
  
  // Step 1 states
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(null) // '1' | '2'
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  
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

  const { data: slots = [], isFetching: slotsLoading, error } = useGetConsultantSlotsQuery(
    { consultantId, date: selectedDate, duration: selectedDuration },
    { skip: !selectedDate || !selectedDuration }
  )

  const [createPaymentIntent, { isLoading: creatingIntent }] = useCreatePaymentIntentMutation()
  const [uploadDocument] = useUploadDocumentMutation()

  async function handleProceedToPayment() {
    if (!selectedSlotId) return
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
        duration: selectedDuration,
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

  function handleDateChange(value) {
    setSelectedDate(value)
    setSelectedSlotId(null)
    setIntentError('')
    setUploadError('')
    setClientSecret(null)
  }

  function handleDurationChange(value) {
    setSelectedDuration(value)
    setSelectedSlotId(null)
    setIntentError('')
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
              setSelectedDuration(null)
              setSelectedSlotId(null)
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
            Book another
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Step 1: Mini-form (Main Component) */}
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

        {/* Duration selector */}
        <div className="form-group">
          <label>Session duration</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {[['1', '1 hour'], ['2', '2 hours']].map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`slot-pill${selectedDuration === val ? ' selected' : ''}`}
                onClick={() => handleDurationChange(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Available slots / Availability request/response */}
        {selectedDate && selectedDuration && (
          <div>
            {error?.status === 401 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  {t.bookingPanel?.unauthorizedMsg || 'Trebuie să fii conectat pentru a vedea intervalele disponibile.'}
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => navigate('/login')}
                >
                  {t.bookingPanel?.connectBtn || 'Conectează-te'}
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>Available times</div>
                {slotsLoading ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading slots…</p>
                ) : slots.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No available slots for this date and duration.</p>
                ) : (
                  <div className="slot-grid">
                    {slots.map((slot) => (
                      <button
                        key={slot.id}
                        className={`slot-pill${selectedSlotId === slot.id ? ' selected' : ''}`}
                        onClick={() => setSelectedSlotId(slot.id)}
                      >
                        {fmtSlotLabel(slot, parseInt(selectedDuration))}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {error?.status !== 401 && (
          <button
            className="btn btn-primary"
            style={{ marginTop: 8 }}
            disabled={!selectedDate || !selectedDuration || !selectedSlotId}
            onClick={() => setIsModalOpen(true)}
          >
            Next Step
          </button>
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
                {clientSecret ? 'Payment Step' : 'Billing & Session Information'}
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
