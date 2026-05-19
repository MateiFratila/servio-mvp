import { useState } from 'react'
import { useGetAllConsultantsQuery, useUpdateConsultantMutation } from './toolsApi'

const SPECIALISATIONS = ['Tax Law', 'VAT Compliance', 'Payroll', 'Audit', 'Corporate Finance', 'Estate Planning']

export default function ManageConsultantsTab() {
  const { data: result, isLoading } = useGetAllConsultantsQuery()
  const consultants = result?.data ?? []
  const [updateConsultant] = useUpdateConsultantMutation()
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState(null)

  const filtered = consultants.filter((c) =>
    c.displayName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>Manage Consultants</h3>
          <input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 220 }}
          />
        </div>

        {isLoading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Specialisation</th>
                  <th>Rate</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.displayName}</td>
                    <td>{c.specialisation}</td>
                    <td>€{Number(c.hourlyRate).toFixed(0)}/hr</td>
                    <td>
                      <span className={c.isActive ? 'badge badge-green' : 'badge badge-grey'}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditTarget({ ...c })}>Edit</button>
                        <button
                          className={`btn btn-sm ${c.isActive ? 'btn-danger' : 'btn-secondary'}`}
                          onClick={() => updateConsultant({ id: c.id, isActive: !c.isActive })}
                        >
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </button>
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
    </>
  )
}

function EditModal({ consultant, onSave, onClose }) {
  const [form, setForm] = useState(consultant)

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: '100%', maxWidth: 480 }}>
        <h3 className="section-title">Edit Consultant</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label>Display Name</label>
            <input value={form.displayName} onChange={(e) => handleChange('displayName', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={3} value={form.description ?? ''} onChange={(e) => handleChange('description', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Specialisation</label>
            <select value={form.specialisation} onChange={(e) => handleChange('specialisation', e.target.value)}>
              {SPECIALISATIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Hourly Rate (€)</label>
            <input type="number" min={0} value={Number(form.hourlyRate)} onChange={(e) => handleChange('hourlyRate', Number(e.target.value))} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={form.isActive} onChange={(e) => handleChange('isActive', e.target.checked)} />
            Active
          </label>
          <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
            <button className="btn btn-primary" onClick={() => onSave(form)}>Save</button>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
