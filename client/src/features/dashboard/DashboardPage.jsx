import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { selectCurrentUser } from '../../features/auth/authSlice'
import { useLabels } from '../../lib/useLabels'
import { useGetMyProfileQuery } from './dashboardApi'
import OverviewTab from './OverviewTab'
import SessionsTab from './SessionsTab'
import AvailabilityTab from './AvailabilityTab'
import ProfileTab from './ProfileTab'
import AccountSettingsTab from './AccountSettingsTab'
import ReviewsTab from './ReviewsTab'
import FeedbackForm from '../../components/FeedbackForm'

export default function DashboardPage() {
  const user = useSelector(selectCurrentUser)
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('overview')
  const t = useLabels()
  const { data: profile } = useGetMyProfileQuery()

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['overview', 'sessions', 'availability', 'profile', 'settings', 'reviews', 'contact'].includes(tabParam)) {
      setActiveTab(tabParam)
    } else {
      setActiveTab('overview')
    }
  }, [searchParams])

  const TABS = [
    { id: 'overview', label: t.dashboard.tabs.overview },
    { id: 'sessions', label: t.dashboard.tabs.sessions },
    { id: 'availability', label: t.dashboard.tabs.availability },
    { id: 'profile', label: t.dashboard.tabs.profile },
    { id: 'settings', label: t.dashboard.tabs.settings },
    { id: 'reviews', label: 'Recenziile mele' },
    { id: 'contact', label: 'Contactează-ne' },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {profile && profile.accountComplete && !profile.hasCurrentAvailability && (
        <div style={{
          background: 'var(--red-bg)',
          color: 'var(--red)',
          borderBottom: '1px solid #fca5a5',
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          Clientii nu va pot rezerva, nu aveti nici un slot disponibil. Completati calendarul de Disponibilitate{' '}
          <button
            onClick={() => {
              setSearchParams((prev) => {
                const newParams = new URLSearchParams(prev)
                newParams.set('tab', 'availability')
                return newParams
              })
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--red)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: '700',
              fontFamily: 'inherit',
              fontSize: 'inherit'
            }}
          >
            aici
          </button>.
        </div>
      )}

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
        {activeTab === 'overview' && <OverviewTab consultantName={user?.name} />}
        {activeTab === 'sessions' && <SessionsTab />}
        {activeTab === 'availability' && <AvailabilityTab />}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'settings' && <AccountSettingsTab />}
        {activeTab === 'reviews' && <ReviewsTab />}
        {activeTab === 'contact' && (
          <div style={{ padding: '8px 0' }}>
            <FeedbackForm initialType="contact" />
          </div>
        )}
      </div>
    </div>
  )
}
