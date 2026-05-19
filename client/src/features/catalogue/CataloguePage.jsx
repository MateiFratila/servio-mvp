import { useState } from 'react'
import ConsultantCard from './ConsultantCard'
import { useGetConsultantsQuery } from './catalogueApi'

const SPECIALISATIONS = ['Tax Law', 'VAT Compliance', 'Payroll', 'Audit', 'Corporate Finance', 'Estate Planning']

export default function CataloguePage() {
  const [selectedSpecs, setSelectedSpecs] = useState([])
  const [maxRate, setMaxRate] = useState(300)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortBy, setSortBy] = useState('displayName')

  const { data, isLoading } = useGetConsultantsQuery({
    ...(selectedSpecs.length && { specialisation: selectedSpecs.join(',') }),
    ...(maxRate < 300 && { maxRate }),
    ...(availableOnly && { availableToday: 'true' }),
    sortBy: sortBy === 'relevance' ? 'displayName' : sortBy === 'name' ? 'displayName' : 'hourlyRate',
    order: sortBy === 'rate-desc' ? 'desc' : 'asc',
    limit: 50,
  })

  const consultants = data?.data ?? []

  function toggleSpec(spec) {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    )
  }

  // client-side name sort isn't needed since server handles it, but keep rate sort for desc
  const sorted = sortBy === 'rate-desc'
    ? [...consultants].sort((a, b) => b.hourlyRate - a.hourlyRate)
    : consultants

  const avgRate = consultants.length
    ? Math.round(consultants.reduce((s, c) => s + Number(c.hourlyRate), 0) / consultants.length)
    : 0

  return (
    <div style={{ flex: 1 }}>
      {/* Stat bar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', gap: 40, padding: '16px 24px' }}>
          <Stat label="Available consultants" value={data?.total ?? '—'} />
          <Stat label="Specialisations" value={SPECIALISATIONS.length} />
          <Stat label="Avg. hourly rate" value={avgRate ? `€${avgRate}` : '—'} />
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
          {isLoading ? (
            <p style={{ color: 'var(--text-muted)', marginTop: 32, textAlign: 'center' }}>Loading…</p>
          ) : (
            <>
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
            </>
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
