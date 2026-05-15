import { useState } from 'react'

const SPECIALISATIONS = ['Tax Law', 'VAT Compliance', 'Payroll', 'Audit', 'Corporate Finance', 'Estate Planning']

const PLACEHOLDER_CONSULTANTS = [
  { id: 1, displayName: 'Lorem Ipsum', specialisation: 'Tax Law', hourlyRate: 90, isActive: true, description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.' },
  { id: 2, displayName: 'Dolor Sit', specialisation: 'VAT Compliance', hourlyRate: 75, isActive: true, description: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.' },
  { id: 3, displayName: 'Amet Consult', specialisation: 'Payroll', hourlyRate: 80, isActive: false, description: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.' },
  { id: 4, displayName: 'Consectetur Adv.', specialisation: 'Audit', hourlyRate: 110, isActive: true, description: 'Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia.' },
]

export default function ManageConsultantsTab() {
  const [consultants, setConsultants] = useState(PLACEHOLDER_CONSULTANTS)
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState(null)
  // TODO: const { data: consultants = [] } = useGetAllConsultantsQuery()
  // TODO: const [updateConsultant] = useUpdateConsultantMutation()

  const filtered = consultants.filter((c) =>
    c.displayName.toLowerCase().includes(search.toLowerCase())
  )

  function toggleActive(id) {
    setConsultants((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c))
  }

  function handleEditSave(updated) {
    setConsultants((prev) => prev.map((c) => c.id === updated.id ? updated : c))
    setEditTarget(null)
  }

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
                  <td>€{c.hourlyRate}/hr</td>
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
                        onClick={() => toggleActive(c.id)}
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
      </div>

      {editTarget && (
        <EditModal
          consultant={editTarget}
          onSave={handleEditSave}
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
            <textarea rows={3} value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Specialisation</label>
            <select value={form.specialisation} onChange={(e) => handleChange('specialisation', e.target.value)}>
              {SPECIALISATIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Hourly Rate (€)</label>
            <input type="number" min={0} value={form.hourlyRate} onChange={(e) => handleChange('hourlyRate', Number(e.target.value))} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={form.isActive} onChange={(e) => handleChange('isActive', e.target.checked)} />
            Active
          </label>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => onSave(form)}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
