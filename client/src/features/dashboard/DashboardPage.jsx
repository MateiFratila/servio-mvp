import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { selectCurrentUser } from '../../features/auth/authSlice'
import { useLabels } from '../../lib/useLabels'
import OverviewTab from './OverviewTab'
import SessionsTab from './SessionsTab'
import AvailabilityTab from './AvailabilityTab'
import ProfileTab from './ProfileTab'
import AccountSettingsTab from './AccountSettingsTab'
import FeedbackForm from '../../components/FeedbackForm'

export default function DashboardPage() {
  const user = useSelector(selectCurrentUser)
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('overview')
  const t = useLabels()

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['overview', 'sessions', 'availability', 'profile', 'settings', 'contact'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const TABS = [
    { id: 'overview', label: t.dashboard.tabs.overview },
    { id: 'sessions', label: t.dashboard.tabs.sessions },
    { id: 'availability', label: t.dashboard.tabs.availability },
    { id: 'profile', label: t.dashboard.tabs.profile },
    { id: 'settings', label: t.dashboard.tabs.settings },
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
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ flex: 1, paddingTop: 32, paddingBottom: 32 }}>
        {activeTab === 'overview' && <OverviewTab consultantName={user?.name} />}
        {activeTab === 'sessions' && <SessionsTab />}
        {activeTab === 'availability' && <AvailabilityTab />}
        {activeTab === 'profile' && <ProfileTab />}
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
