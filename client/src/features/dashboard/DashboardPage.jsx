import { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../../features/auth/authSlice'
import OverviewTab from './OverviewTab'
import SessionsTab from './SessionsTab'
import AvailabilityTab from './AvailabilityTab'
import ProfileTab from './ProfileTab'
import AccountSettingsTab from './AccountSettingsTab'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'sessions', label: 'Sesiunile mele' },
  { id: 'availability', label: 'Disponibilitate' },
  { id: 'profile', label: 'Profilul meu' },
  { id: 'settings', label: 'Setări cont' },
]

export default function DashboardPage() {
  const user = useSelector(selectCurrentUser)
  const [activeTab, setActiveTab] = useState('overview')

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
      </div>
    </div>
  )
}
