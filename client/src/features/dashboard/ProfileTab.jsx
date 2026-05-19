import { useState, useEffect } from 'react'
import { useGetMyProfileQuery, useUpdateMyProfileMutation } from './dashboardApi'

const SPECIALISATIONS = ['Tax Law', 'VAT Compliance', 'Payroll', 'Audit', 'Corporate Finance', 'Estate Planning']

export default function ProfileTab() {
  const { data: me, isLoading } = useGetMyProfileQuery()
  const [updateProfile, { isLoading: saving }] = useUpdateMyProfileMutation()

  const profileData = me?.profile
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profileData) {
      setForm({
        displayName: profileData.displayName ?? '',
        specialisation: profileData.specialisation ?? SPECIALISATIONS[0],
        description: profileData.description ?? '',
        hourlyRate: Number(profileData.hourlyRate) ?? 0,
      })
    }
  }, [profileData])

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await updateProfile(form)
    setSaved(true)
  }

  if (isLoading || !form) return <div className="card"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h3 className="section-title">My Profile</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <img
            src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(form.displayName)}`}
            alt="Avatar"
            style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--grey-bg)' }}
          />
          <button type="button" className="btn btn-secondary btn-sm">Upload photo</button>
        </div>

        <div className="form-group">
          <label>Display Name</label>
          <input value={form.displayName} onChange={(e) => handleChange('displayName', e.target.value)} />
        </div>

        <div className="form-group">
          <label>Specialisation</label>
          <select value={form.specialisation} onChange={(e) => handleChange('specialisation', e.target.value)}>
            {SPECIALISATIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Bio</label>
          <textarea rows={4} value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
        </div>

        <div className="form-group">
          <label>Hourly Rate (€)</label>
          <input
            type="number"
            min={0}
            value={form.hourlyRate}
            onChange={(e) => handleChange('hourlyRate', Number(e.target.value))}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && <span style={{ fontSize: 13, color: 'var(--green)' }}>✓ Saved</span>}
        </div>
      </form>
    </div>
  )
}
