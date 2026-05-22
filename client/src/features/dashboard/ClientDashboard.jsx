import { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../auth/authSlice'
import MySessionsPanel from '../catalogue/MySessionsPanel'

const TABS = [
  { id: 'sessions', label: 'Sesiunile mele' },
  { id: 'profile', label: 'Profilul meu' },
]

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState('sessions')

  return (
    <div className="sidebar-layout">
      <aside className="sidebar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`sidebar-link${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </aside>

      <main className="sidebar-content">
        {activeTab === 'sessions' && <ClientSessionsTab />}
        {activeTab === 'profile' && <ClientProfileTab />}
      </main>
    </div>
  )
}

function ClientSessionsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <MySessionsPanel />
    </div>
  )
}

function ClientProfileTab() {
  const user = useSelector(selectCurrentUser)
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '' })
  const [saved, setSaved] = useState(false)
  // TODO: connect to PATCH /api/users/me

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    // TODO: dispatch updateMyProfile(form)
    setSaved(true)
  }

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <h3 className="section-title">Profilul meu</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
          <img
            src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(form.name || 'U')}`}
            alt="Avatar"
            style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--grey-bg)' }}
          />
          <button type="button" className="btn btn-secondary btn-sm">Schimbă poza</button>
        </div>

        <div className="form-group">
          <label>Nume</label>
          <input
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Numele tău"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="email@exemplu.ro"
          />
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="submit" className="btn btn-primary">Salvează</button>
          {saved && <span style={{ fontSize: 13, color: 'var(--green)' }}>✓ Salvat</span>}
        </div>
      </form>
    </div>
  )
}

