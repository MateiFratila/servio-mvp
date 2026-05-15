import { useState } from 'react'

const SPECIALISATIONS = ['Tax Law', 'VAT Compliance', 'Payroll', 'Audit', 'Corporate Finance', 'Estate Planning']

const PLACEHOLDER_PROFILE = {
  displayName: 'Lorem Ipsum',
  specialisation: 'Tax Law',
  bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque vehicula erat at pretium tristique, lorem purus convallis nisi, at sagittis mauris sapien et ex.',
  hourlyRate: 90,
}

export default function ProfileTab() {
  const [form, setForm] = useState(PLACEHOLDER_PROFILE)
  const [saved, setSaved] = useState(false)
  // TODO: const { data } = useGetMyProfileQuery()
  // TODO: const [updateProfile] = useUpdateMyProfileMutation()

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    // TODO: updateProfile(form)
    setSaved(true)
  }

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
          <textarea rows={4} value={form.bio} onChange={(e) => handleChange('bio', e.target.value)} />
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
          <button type="submit" className="btn btn-primary">Save Changes</button>
          {saved && <span style={{ fontSize: 13, color: 'var(--green)' }}>✓ Saved</span>}
        </div>
      </form>
    </div>
  )
}
