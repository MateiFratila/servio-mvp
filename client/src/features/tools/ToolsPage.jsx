import { useState } from 'react'
import PlatformOverviewTab from './PlatformOverviewTab'
import ManageConsultantsTab from './ManageConsultantsTab'
import AllSessionsTab from './AllSessionsTab'
import UserManagementTab from './UserManagementTab'
import SystemSettingsTab from './SystemSettingsTab'
import FeedbacksTab from './FeedbacksTab'
import SuggestionsVettingTab from './SuggestionsVettingTab'

const TABS = [
  { id: 'overview', label: 'Platform Overview' },
  { id: 'consultants', label: 'Manage Consultants' },
  { id: 'sessions', label: 'All Sessions' },
  { id: 'users', label: 'User Management' },
  { id: 'settings', label: 'System Settings' },
  { id: 'feedbacks', label: 'Feedback & Contact' },
  { id: 'suggestions', label: 'Suggestions Vetting' },
]

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div className="page-header" style={{ padding: '0 0 24px' }}>
        <h1>Tools</h1>
        <p>Platform administration and management.</p>
      </div>

      <div className="tab-bar">
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

      {activeTab === 'overview' && <PlatformOverviewTab />}
      {activeTab === 'consultants' && <ManageConsultantsTab />}
      {activeTab === 'sessions' && <AllSessionsTab />}
      {activeTab === 'users' && <UserManagementTab />}
      {activeTab === 'settings' && <SystemSettingsTab />}
      {activeTab === 'feedbacks' && <FeedbacksTab />}
      {activeTab === 'suggestions' && <SuggestionsVettingTab />}
    </div>
  )
}
