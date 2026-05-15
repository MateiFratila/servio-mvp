import { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../../features/auth/authSlice'
import OverviewTab from './OverviewTab'
import SessionsTab from './SessionsTab'
import AvailabilityTab from './AvailabilityTab'
import ProfileTab from './ProfileTab'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'sessions', label: 'My Sessions' },
  { id: 'availability', label: 'Availability' },
  { id: 'profile', label: 'My Profile' },
]

export default function DashboardPage() {
  const user = useSelector(selectCurrentUser)
  const [activeTab, setActiveTab] = useState('overview')

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
        {activeTab === 'overview' && <OverviewTab consultantName={user?.name} />}
        {activeTab === 'sessions' && <SessionsTab />}
        {activeTab === 'availability' && <AvailabilityTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </main>
    </div>
  )
}
