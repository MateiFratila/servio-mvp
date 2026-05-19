import { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../auth/authSlice'

// TODO: replace with useGetMySessionsAsClientQuery()
const PLACEHOLDER_SESSIONS = [
  { id: 4821, consultant: 'Lorem Ipsum', dateTime: '20 May 2026, 10:30', status: 'pending' },
  { id: 4820, consultant: 'Dolor Sit', dateTime: '25 May 2026, 14:00', status: 'confirmed' },
  { id: 4819, consultant: 'Amet Consult', dateTime: '02 Jun 2026, 09:00', status: 'completed' },
]

const STATUS_BADGE = {
  pending: 'badge status-pending',
  confirmed: 'badge status-confirmed',
  completed: 'badge status-completed',
  cancelled: 'badge status-cancelled',
}

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
  const [sessions, setSessions] = useState(PLACEHOLDER_SESSIONS)

  function handleCancel(id) {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, status: 'cancelled' } : s))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="kpi-grid">
        <KPICard label="Sesiuni programate" value={sessions.filter((s) => s.status === 'confirmed' || s.status === 'pending').length} />
        <KPICard label="În așteptare" value={sessions.filter((s) => s.status === 'pending').length} accent />
        <KPICard label="Finalizate" value={sessions.filter((s) => s.status === 'completed').length} />
      </div>

      <div className="card">
        <h3 className="section-title">Sesiunile mele</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Consultant</th>
                <th>Dată &amp; Oră</th>
                <th>Status</th>
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>{s.consultant}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{s.dateTime}</td>
                  <td><span className={STATUS_BADGE[s.status]}>{s.status}</span></td>
                  <td>
                    {(s.status === 'pending' || s.status === 'confirmed') && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(s.id)}>
                        Anulează
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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

function KPICard({ label, value, accent }) {
  return (
    <div className="card kpi-card">
      <div className="kpi-value" style={accent ? { color: 'var(--yellow)' } : {}}>{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}
