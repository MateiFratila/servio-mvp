import { useState } from 'react'
import ConsultantCard from './ConsultantCard'

const SPECIALISATIONS = ['Tax Law', 'VAT Compliance', 'Payroll', 'Audit', 'Corporate Finance', 'Estate Planning']

const PLACEHOLDER_CONSULTANTS = [
  { id: 1, displayName: 'Lorem Ipsum', specialisation: 'Tax Law', bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.', hourlyRate: 90, avatarUrl: null },
  { id: 2, displayName: 'Dolor Sit', specialisation: 'VAT Compliance', bio: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.', hourlyRate: 75, avatarUrl: null },
  { id: 3, displayName: 'Amet Consult', specialisation: 'Payroll', bio: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.', hourlyRate: 80, avatarUrl: null },
  { id: 4, displayName: 'Consectetur Adv.', specialisation: 'Audit', bio: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', hourlyRate: 110, avatarUrl: null },
  { id: 5, displayName: 'Adipiscing Elite', specialisation: 'Corporate Finance', bio: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem.', hourlyRate: 120, avatarUrl: null },
  { id: 6, displayName: 'Eiusmod Tempor', specialisation: 'Estate Planning', bio: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit sed consequuntur magni dolores.', hourlyRate: 95, avatarUrl: null },
]

export default function CataloguePage() {
  const [selectedSpecs, setSelectedSpecs] = useState([])
  const [maxRate, setMaxRate] = useState(300)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortBy, setSortBy] = useState('relevance')

  // TODO: replace with useGetConsultantsQuery({ specs, maxRate, sortBy })
  const consultants = PLACEHOLDER_CONSULTANTS

  function toggleSpec(spec) {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    )
  }

  const filtered = consultants.filter((c) => {
    if (selectedSpecs.length && !selectedSpecs.includes(c.specialisation)) return false
    if (c.hourlyRate > maxRate) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'rate-asc') return a.hourlyRate - b.hourlyRate
    if (sortBy === 'rate-desc') return b.hourlyRate - a.hourlyRate
    if (sortBy === 'name') return a.displayName.localeCompare(b.displayName)
    return 0
  })

  const avgRate = Math.round(consultants.reduce((s, c) => s + c.hourlyRate, 0) / consultants.length)

  return (
    <div style={{ flex: 1 }}>
      {/* Stat bar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', gap: 40, padding: '16px 24px' }}>
          <Stat label="Available consultants" value={consultants.length} />
          <Stat label="Specialisations" value={SPECIALISATIONS.length} />
          <Stat label="Avg. hourly rate" value={`€${avgRate}`} />
        </div>
      </div>

      <div className="container" style={{ display: 'flex', gap: 24, padding: '24px 24px' }}>
        {/* Filter sidebar */}
        <aside style={{ width: 220, flexShrink: 0 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 24 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Specialisation</div>
              {SPECIALISATIONS.map((s) => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto' }}
                    checked={selectedSpecs.includes(s)}
                    onChange={() => toggleSpec(s)}
                  />
                  {s}
                </label>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Max rate: €{maxRate}</div>
              <input
                type="range"
                min={0}
                max={300}
                value={maxRate}
                onChange={(e) => setMaxRate(Number(e.target.value))}
                style={{ width: '100%', padding: 0 }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input
                type="checkbox"
                style={{ width: 'auto' }}
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
              />
              Available today only
            </label>

            <div className="form-group">
              <label>Sort by</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="relevance">Relevance</option>
                <option value="rate-asc">Rate (low → high)</option>
                <option value="rate-desc">Rate (high → low)</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {sorted.map((c) => (
              <ConsultantCard key={c.id} consultant={c} />
            ))}
          </div>
          {sorted.length === 0 && (
            <p style={{ color: 'var(--text-muted)', marginTop: 32, textAlign: 'center' }}>
              No consultants match your filters.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}
