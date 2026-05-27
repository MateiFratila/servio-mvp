import { useState } from 'react'
import { useLabels } from '../../lib/useLabels'
import MySessionsPanel from '../catalogue/MySessionsPanel'
import AccountSettingsTab from './AccountSettingsTab'

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState('sessions')
  const t = useLabels()

  const TABS = [
    { id: 'sessions', label: t.clientDashboard.tabs.sessions },
    { id: 'settings', label: t.clientDashboard.tabs.settings },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="tab-bar" style={{ marginBottom: 0 }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ flex: 1, paddingTop: 32, paddingBottom: 32 }}>
        {activeTab === 'sessions' && <ClientSessionsTab />}
        {activeTab === 'settings' && <AccountSettingsTab />}
      </div>
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

