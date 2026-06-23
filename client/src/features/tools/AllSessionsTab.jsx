import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetAllSessionsQuery, useForceDeleteSessionMutation, useGetSystemSettingsQuery } from './toolsApi'

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUSES = ['All', 'pending', 'pending_confirmation', 'confirmed', 'completed', 'cancelled']

const STATUS_BADGE = {
  pending: 'badge status-pending',
  pending_confirmation: 'badge status-pending',
  confirmed: 'badge status-confirmed',
  completed: 'badge status-completed',
  cancelled: 'badge status-cancelled',
}

export default function AllSessionsTab() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('All')
  const { data: settingsData } = useGetSystemSettingsQuery()
  const stripeMode = settingsData?.stripe?.mode || 'test'
  const { data, isLoading } = useGetAllSessionsQuery(
    statusFilter !== 'All' ? { status: statusFilter } : {}
  )
  const [forceDelete] = useForceDeleteSessionMutation()
  const sessions = data?.data ?? []

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>All Sessions</h3>
        <div className="tab-bar" style={{ marginBottom: 0, borderBottom: 'none', gap: 4 }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`tab-btn${statusFilter === s ? ' active' : ''}`}
              style={{ padding: '4px 12px', fontSize: 12 }}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Client</th>
                <th>Consultant</th>
                <th>Date</th>
                <th>Status</th>
                <th>Stripe Transaction</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/sessions/${s.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{s.id}</td>
                  <td>{s.client?.email ?? '—'}</td>
                  <td style={{ fontWeight: 500 }}>{s.consultant?.displayName ?? '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{fmtDateTime(s.slot?.startTime)}</td>
                  <td><span className={STATUS_BADGE[s.status]}>{s.status}</span></td>
                  <td>
                    {s.stripePaymentIntentId ? (
                      <a
                        href={stripeMode === 'test'
                          ? `https://dashboard.stripe.com/test/payments/${s.stripePaymentIntentId}`
                          : `https://dashboard.stripe.com/payments/${s.stripePaymentIntentId}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: 'var(--primary)', textDecoration: 'underline', fontFamily: 'monospace' }}
                      >
                        {s.stripePaymentIntentId}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {s.status !== 'cancelled' && s.status !== 'completed' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            forceDelete(s.id)
                          }}
                        >
                          Force-cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No sessions.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
