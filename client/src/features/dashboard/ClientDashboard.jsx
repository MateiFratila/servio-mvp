import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLabels } from '../../lib/useLabels'
import MySessionsPanel from '../catalogue/MySessionsPanel'
import AccountSettingsTab from './AccountSettingsTab'
import FeedbackForm from '../../components/FeedbackForm'

export default function ClientDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('sessions')
  const t = useLabels()

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['sessions', 'settings', 'contact'].includes(tabParam)) {
      setActiveTab(tabParam)
    } else {
      setActiveTab('sessions')
    }
  }, [searchParams])

  const TABS = [
    { id: 'sessions', label: t.clientDashboard.tabs.sessions },
    { id: 'settings', label: t.clientDashboard.tabs.settings },
    { id: 'contact', label: 'Contactează-ne' },
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
                onClick={() => {
                  setSearchParams((prev) => {
                    const newParams = new URLSearchParams(prev)
                    newParams.set('tab', tab.id)
                    return newParams
                  })
                }}
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
        {activeTab === 'contact' && (
          <div style={{ padding: '8px 0' }}>
            <FeedbackForm initialType="contact" />
          </div>
        )}
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

