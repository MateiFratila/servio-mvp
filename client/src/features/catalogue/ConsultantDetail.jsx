import { useState } from 'react'
import { useParams } from 'react-router-dom'
import BookingPanel from './BookingPanel'
import MySessionsPanel from './MySessionsPanel'

const PLACEHOLDER_CONSULTANTS = {
  1: {
    id: 1,
    displayName: 'Lorem Ipsum',
    specialisation: 'Tax Law',
    bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque vehicula, erat at pretium tristique, lorem purus convallis nisi, at sagittis mauris sapien et ex. Maecenas dignissim quam nec ante porttitor, ut sagittis ligula tincidunt. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.',
    hourlyRate: 90,
    tags: ['Tax Law', 'VAT', 'Audit'],
    rating: 4.8,
    reviewCount: 12,
    avatarUrl: null,
  },
}

export default function ConsultantDetail() {
  const { id } = useParams()
  // TODO: replace with useGetConsultantQuery(id)
  const consultant = PLACEHOLDER_CONSULTANTS[id] ?? {
    id: Number(id),
    displayName: 'Dolor Sit',
    specialisation: 'VAT Compliance',
    bio: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    hourlyRate: 75,
    tags: ['VAT Compliance', 'Payroll'],
    rating: 4.5,
    reviewCount: 8,
    avatarUrl: null,
  }

  return (
    <div className="container" style={{ padding: '32px 24px', display: 'flex', gap: 32, alignItems: 'flex-start' }}>
      {/* Profile – left */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="card" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <img
            src={consultant.avatarUrl ?? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(consultant.displayName)}`}
            alt={consultant.displayName}
            style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: 'var(--grey-bg)' }}
          />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{consultant.displayName}</h2>
            <span className="badge badge-blue" style={{ marginBottom: 12, display: 'inline-block' }}>{consultant.specialisation}</span>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 14 }}>{consultant.bio}</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>€{consultant.hourlyRate} / hr</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {consultant.tags.map((t) => (
                  <span key={t} className="badge badge-grey">{t}</span>
                ))}
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                ⭐ {consultant.rating} ({consultant.reviewCount} reviews)
              </span>
            </div>
          </div>
        </div>

        <MySessionsPanel />
      </div>

      {/* Booking panel – right */}
      <div style={{ width: 320, flexShrink: 0 }}>
        <BookingPanel consultantId={consultant.id} consultantName={consultant.displayName} />
      </div>
    </div>
  )
}
