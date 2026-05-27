import { useState } from 'react'
import ConsultantCard from './ConsultantCard'
import { useGetConsultantsQuery, useGetSpecialisationsQuery } from './catalogueApi'
import { useLabels } from '../../lib/useLabels'

export default function CataloguePage() {
  const t = useLabels()
  const [selectedSpecIds, setSelectedSpecIds] = useState([])
  const [maxRate, setMaxRate] = useState(300)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortBy, setSortBy] = useState('displayName')

  const { data: specialisationsData = [] } = useGetSpecialisationsQuery()

  const { data, isLoading } = useGetConsultantsQuery({
    ...(selectedSpecIds.length && { specialisationIds: selectedSpecIds.join(',') }),
    ...(maxRate < 300 && { maxRate }),
    ...(availableOnly && { availableToday: 'true' }),
    sortBy: sortBy === 'relevance' ? 'displayName' : sortBy === 'name' ? 'displayName' : 'hourlyRate',
    order: sortBy === 'rate-desc' ? 'desc' : 'asc',
    limit: 50,
  })

  const consultants = data?.data ?? []

  function toggleSpec(id) {
    setSelectedSpecIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

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
          <Stat label={t.catalogue.stats.available} value={data?.total ?? '—'} />
          <Stat label={t.catalogue.stats.specialisations} value={specialisationsData.length} />
          <Stat label={t.catalogue.stats.avgRate} value={avgRate ? `€${avgRate}` : '—'} />
        </div>
      </div>

      <div className="container" style={{ display: 'flex', gap: 24, padding: '24px 24px' }}>
        {/* Filter sidebar */}
        <aside style={{ width: 220, flexShrink: 0 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 24 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>{t.catalogue.filters.specialisation}</div>
              {specialisationsData.map((s) => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto' }}
                    checked={selectedSpecIds.includes(s.id)}
                    onChange={() => toggleSpec(s.id)}
                  />
                  {s.name}
                </label>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{t.catalogue.filters.maxRate(maxRate)}</div>
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
              {t.catalogue.filters.availableToday}
            </label>

            <div className="form-group">
              <label>{t.catalogue.filters.sortBy}</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="relevance">{t.catalogue.filters.sortOptions.relevance}</option>
                <option value="rate-asc">{t.catalogue.filters.sortOptions.rateAsc}</option>
                <option value="rate-desc">{t.catalogue.filters.sortOptions.rateDesc}</option>
                <option value="name">{t.catalogue.filters.sortOptions.name}</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div style={{ flex: 1 }}>
          {isLoading ? (
            <p style={{ color: 'var(--text-muted)', marginTop: 32, textAlign: 'center' }}>{t.sessionsTab.loading}</p>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {sorted.map((c) => (
                  <ConsultantCard key={c.id} consultant={c} />
                ))}
              </div>
              {sorted.length === 0 && (
                <p style={{ color: 'var(--text-muted)', marginTop: 32, textAlign: 'center' }}>
                  {t.catalogue.noResults}
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
