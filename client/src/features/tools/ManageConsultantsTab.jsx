import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useGetAllConsultantsQuery,
  useUpdateConsultantMutation,
  useChangeConsultantEmailMutation,
  useResendConsultantActivationMutation,
} from './toolsApi'

const SPECIALISATIONS = ['Tax Law', 'VAT Compliance', 'Payroll', 'Audit', 'Corporate Finance', 'Estate Planning']

export default function ManageConsultantsTab() {
  const { data: result, isLoading } = useGetAllConsultantsQuery()
  const consultants = result?.data ?? []
  const [updateConsultant] = useUpdateConsultantMutation()
  const [changeEmail] = useChangeConsultantEmailMutation()
  const [resendActivation] = useResendConsultantActivationMutation()

  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('displayName')
  const [sortOrder, setSortOrder] = useState('asc')
  const [editTarget, setEditTarget] = useState(null)
  const [changeEmailTarget, setChangeEmailTarget] = useState(null)

  const filtered = consultants.filter((c) =>
    (c.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.user?.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const sortedAndFiltered = [...filtered].sort((a, b) => {
    let valA, valB

    if (sortKey === 'displayName') {
      valA = (a.displayName || '').toLowerCase()
      valB = (b.displayName || '').toLowerCase()
    } else if (sortKey === 'email') {
      valA = (a.user?.email || '').toLowerCase()
      valB = (b.user?.email || '').toLowerCase()
    } else {
      valA = a[sortKey]
      valB = b[sortKey]
    }

    if (valA === undefined || valA === null) valA = ''
    if (valB === undefined || valB === null) valB = ''

    if (typeof valA === 'boolean' && typeof valB === 'boolean') {
      return sortOrder === 'asc'
        ? (valA === valB ? 0 : valA ? 1 : -1)
        : (valA === valB ? 0 : valA ? -1 : 1)
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const handleResendActivation = async (id) => {
    if (!window.confirm('Ești sigur că vrei să retrimiți emailul de activare? (Token-ul va fi valabil 1 oră)')) return
    try {
      const res = await resendActivation(id).unwrap()
      alert(res.message || 'Email de activare retrimis cu succes!')
    } catch (err) {
      alert(err?.data?.error || 'A apărut o eroare la retrimiterea emailului.')
    }
  }

  const handleChangeEmail = async (email) => {
    try {
      const res = await changeEmail({ id: changeEmailTarget.id, email }).unwrap()
      alert(res.message || 'Email schimbat cu succes!')
    } catch (err) {
      alert(err?.data?.error || 'A apărut o eroare la schimbarea emailului.')
      throw err
    }
  }

  // Pure SVG Icons for Table Actions & Sort indicators
  const IconEdit = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )

  const IconEnvelope = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )

  const IconExternal = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )

  const IconPaperPlane = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )

  const IconToggleOn = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="22" height="14" rx="7" />
      <circle cx="16" cy="12" r="3" fill="currentColor" />
    </svg>
  )

  const IconToggleOff = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="22" height="14" rx="7" />
      <circle cx="8" cy="12" r="3" />
    </svg>
  )

  const IconCheck = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )

  const IconX = () => (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )

  const renderBoolBadge = (value, trueLabel = 'Yes', falseLabel = 'No', trueColor = 'badge-green', falseColor = 'badge-red') => {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          borderRadius: '30px',
          fontSize: '11px',
          fontWeight: '600',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}
        className={`badge ${value ? trueColor : falseColor}`}
      >
        <span style={{ display: 'inline-flex', borderRadius: '50%', padding: 2, background: 'rgba(255,255,255,0.4)' }}>
          {value ? <IconCheck /> : <IconX />}
        </span>
        {value ? trueLabel : falseLabel}
      </span>
    )
  }

  const renderSortHeader = (label, key) => {
    const isSorted = sortKey === key
    return (
      <th
        onClick={() => handleSort(key)}
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          padding: '12px 14px',
          background: isSorted ? 'rgba(55, 125, 255, 0.04)' : 'transparent',
          borderBottom: isSorted ? '2px solid var(--primary-blue)' : '2px solid var(--border)',
          transition: 'background-color 0.2s ease',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: isSorted ? 'var(--primary-dark)' : 'var(--text-muted)' }}>
            {label}
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: isSorted ? 'var(--primary-blue)' : 'var(--text-muted)',
            opacity: isSorted ? 1 : 0.4,
            transition: 'opacity 0.2s',
          }}>
            {isSorted ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
          </span>
        </div>
      </th>
    )
  }

  return (
    <>
      <div className="card" style={{ padding: '20px 24px', position: 'relative' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 className="section-title" style={{ marginBottom: 4, fontSize: '18px', fontWeight: '700' }}>Manage Consultants</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
              Checklist validation and active account status tooling ({sortedAndFiltered.length} profile{sortedAndFiltered.length !== 1 ? 's' : ''})
            </p>
          </div>
          <div style={{ position: 'relative', width: '100%', maxWidth: 280 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: 'var(--text-muted)', pointerEvents: 'none' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading consultants list…</p>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: '10px', overflowX: 'auto', background: 'var(--surface)', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ margin: 0, borderCollapse: 'separate', width: '100%', minWidth: '1050px' }}>
              <thead>
                <tr style={{ background: '#FAFBFD' }}>
                  {renderSortHeader('Name / Email', 'displayName')}
                  {renderSortHeader('Email Verified', 'isEmailConfirmed')}
                  {renderSortHeader('Rate Set', 'isHourlyRateSet')}
                  {renderSortHeader('Stripe Ready', 'isStripeOnboarded')}
                  {renderSortHeader('Availability', 'hasCurrentAvailability')}
                  {renderSortHeader('Profile Set', 'isProfileSetupComplete')}
                  {renderSortHeader('Checklist', 'accountComplete')}
                  {renderSortHeader('Status', 'isActive')}
                  <th style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', borderBottom: '2px solid var(--border)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFiltered.map((c) => (
                  <tr key={c.id} style={{ transition: 'background-color 0.15s ease' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: '13.5px' }}>{c.displayName || 'Unnamed'}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 400, marginTop: 1 }}>
                        {c.user?.email}
                      </div>
                      {c.user?.phone && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.79 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span>{c.user.phone}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>{renderBoolBadge(c.isEmailConfirmed, 'Yes', 'No')}</td>
                    <td style={{ padding: '12px 14px' }}>{renderBoolBadge(c.isHourlyRateSet, 'Yes', 'No')}</td>
                    <td style={{ padding: '12px 14px' }}>{renderBoolBadge(c.isStripeOnboarded, 'Yes', 'No')}</td>
                    <td style={{ padding: '12px 14px' }}>{renderBoolBadge(c.hasCurrentAvailability, 'Yes', 'No')}</td>
                    <td style={{ padding: '12px 14px' }}>{renderBoolBadge(c.isProfileSetupComplete, 'Yes', 'No')}</td>
                    <td style={{ padding: '12px 14px' }}>{renderBoolBadge(c.accountComplete, 'Complete', 'Incomplete', 'badge-blue', 'badge-red')}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        className={c.isActive ? 'badge badge-green' : 'badge badge-grey'}
                        style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', width: '1%' }}>
                      <div style={{ display: 'inline-flex', borderRadius: '8px', padding: 2, gap: 4, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <Tooltip content="Edit profile details like name & rate">
                          <button
                            className="btn-tertiary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 28,
                              height: 28,
                              padding: 0,
                              borderRadius: '6px',
                              color: 'var(--primary-blue)',
                              background: 'transparent',
                              cursor: 'pointer',
                            }}
                            onClick={() => setEditTarget({ ...c })}
                          >
                            <IconEdit />
                          </button>
                        </Tooltip>
                        <Tooltip content="Change registered email address">
                          <button
                            className="btn-tertiary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 28,
                              height: 28,
                              padding: 0,
                              borderRadius: '6px',
                              color: 'var(--primary-blue)',
                              background: 'transparent',
                              cursor: 'pointer',
                            }}
                            onClick={() => setChangeEmailTarget(c)}
                          >
                            <IconEnvelope />
                          </button>
                        </Tooltip>
                        {!c.isEmailConfirmed && (
                          <Tooltip content="Resend activation email (token valid 1h)">
                            <button
                              className="btn-tertiary"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 28,
                                height: 28,
                                padding: 0,
                                borderRadius: '6px',
                                color: 'var(--yellow)',
                                background: 'transparent',
                                cursor: 'pointer',
                              }}
                              onClick={() => handleResendActivation(c.id)}
                            >
                              <IconPaperPlane />
                            </button>
                          </Tooltip>
                        )}
                        <Tooltip content="See live consultant catalog profile">
                          <Link
                            to={`/catalog/${c.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-tertiary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 28,
                              height: 28,
                              padding: 0,
                              borderRadius: '6px',
                              color: 'var(--primary-dark)',
                              background: 'transparent',
                              cursor: 'pointer',
                            }}
                          >
                            <IconExternal />
                          </Link>
                        </Tooltip>
                        <Tooltip content={c.isActive ? 'Deactivate consultant profile' : 'Activate consultant profile'}>
                          <button
                            className="btn-tertiary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 28,
                              height: 28,
                              padding: 0,
                              borderRadius: '6px',
                              color: c.isActive ? 'var(--red)' : 'var(--green)',
                              background: 'transparent',
                              cursor: 'pointer',
                            }}
                            onClick={() => updateConsultant({ id: c.id, isActive: !c.isActive })}
                          >
                            {c.isActive ? <IconToggleOn /> : <IconToggleOff />}
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editTarget && (
        <EditModal
          consultant={editTarget}
          onSave={(updated) => { updateConsultant(updated); setEditTarget(null) }}
          onClose={() => setEditTarget(null)}
        />
      )}

      {changeEmailTarget && (
        <ChangeEmailModal
          consultant={changeEmailTarget}
          onSave={handleChangeEmail}
          onClose={() => setChangeEmailTarget(null)}
        />
      )}
    </>
  )
}

function EditModal({ consultant, onSave, onClose }) {
  const [form, setForm] = useState(consultant)

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(16, 26, 40, 0.4)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="section-title" style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Edit Consultant</h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: 4,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Display Name</label>
            <input
              value={form.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13.5px', borderRadius: '6px' }}
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Description</label>
            <textarea
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => handleChange('description', e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13.5px', borderRadius: '6px' }}
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Specialisation</label>
            <select
              value={form.specialisation}
              onChange={(e) => handleChange('specialisation', e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13.5px', borderRadius: '6px' }}
            >
              {SPECIALISATIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Hourly Rate (€)</label>
            <input
              type="number"
              min={0}
              value={Number(form.hourlyRate)}
              onChange={(e) => handleChange('hourlyRate', Number(e.target.value))}
              style={{ padding: '8px 12px', fontSize: '13.5px', borderRadius: '6px' }}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, userSelect: 'none', margin: '4px 0' }}>
            <input
              type="checkbox"
              style={{ width: 'auto', margin: 0 }}
              checked={form.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
            />
            <span>Active on platform</span>
          </label>
          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onSave(form)}>Save Changes</button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChangeEmailModal({ consultant, onSave, onClose }) {
  const [email, setEmail] = useState(consultant.user?.email || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!email || !email.includes('@')) {
      setError('Adresa de email este nevalidă.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSave(email)
      onClose()
    } catch (err) {
      setError(err?.data?.error || 'A apărut o eroare la salvarea emailului.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(16, 26, 40, 0.4)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="section-title" style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Schimbare Email</h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: 4,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
          Modifică adresa de email pentru consultantul <strong>{consultant.displayName || 'Unnamed'}</strong>.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Noua adresă de email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: nume@domeniu.ro"
              style={{ padding: '8px 12px', fontSize: '13.5px', borderRadius: '6px' }}
            />
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: '13px', marginTop: -4 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
              {loading ? 'Se salvează…' : 'Salvează'}
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={onClose} disabled={loading}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Tooltip({ children, content }) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      style={{ position: 'relative', display: 'inline-flex' }}
    >
      {children}
      {visible && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-6px)',
            background: 'var(--primary-dark)',
            color: 'var(--white)',
            padding: '5px 9px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(16, 26, 40, 0.15)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {content}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '4px',
              borderStyle: 'solid',
              borderColor: 'var(--primary-dark) transparent transparent transparent',
            }}
          />
        </div>
      )}
    </div>
  )
}
