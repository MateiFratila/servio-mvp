import { useState } from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TIME_SLOTS = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30']

// Placeholder: true = available, false = blocked, string = booked (client name)
const INITIAL_GRID = Object.fromEntries(
  DAYS.map((d, di) => [
    d,
    Object.fromEntries(
      TIME_SLOTS.map((t, ti) => {
        if (di === 0 && ti === 0) return [t, 'Client A']   // booked
        if (di === 1 && ti === 2) return [t, 'Ipsum Corp'] // booked
        if (di <= 4 && ti <= 4) return [t, true]           // available
        return [t, false]                                   // blocked
      })
    ),
  ])
)

export default function AvailabilityTab() {
  const [grid, setGrid] = useState(INITIAL_GRID)
  const [saved, setSaved] = useState(false)
  // TODO: replace with useGetMySlotsQuery() + useUpdateMySlotsMutation()

  function toggle(day, time) {
    const current = grid[day][time]
    if (typeof current === 'string') return // booked — read-only
    setGrid((prev) => ({
      ...prev,
      [day]: { ...prev[day], [time]: !current },
    }))
    setSaved(false)
  }

  function handleSave() {
    // TODO: dispatch updateMySlots with grid
    setSaved(true)
  }

  function cellStyle(value) {
    if (typeof value === 'string') return { background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid #bfdbfe', cursor: 'default' }
    if (value) return { background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid #bbf7d0', cursor: 'pointer' }
    return { background: 'var(--grey-bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer' }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>Weekly Availability</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Legend color="var(--green-bg)" borderColor="#bbf7d0" label="Available" />
          <Legend color="var(--grey-bg)" borderColor="var(--border)" label="Blocked" />
          <Legend color="var(--blue-bg)" borderColor="#bfdbfe" label="Booked" />
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            {saved ? '✓ Saved' : 'Save Availability'}
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 4 }}>
          <thead>
            <tr>
              <th style={{ width: 60 }}></th>
              {TIME_SLOTS.map((t) => (
                <th key={t} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 8px' }}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => (
              <tr key={day}>
                <td style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', paddingRight: 8 }}>{day}</td>
                {TIME_SLOTS.map((time) => {
                  const val = grid[day][time]
                  return (
                    <td
                      key={time}
                      onClick={() => toggle(day, time)}
                      title={typeof val === 'string' ? `Booked: ${val}` : undefined}
                      style={{
                        borderRadius: 6,
                        padding: '8px 12px',
                        fontSize: 11,
                        fontWeight: 500,
                        textAlign: 'center',
                        minWidth: 64,
                        userSelect: 'none',
                        border: 'none',
                        ...cellStyle(val),
                      }}
                    >
                      {typeof val === 'string' ? '●' : val ? 'Open' : 'Off'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Legend({ color, borderColor, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
      <span style={{ width: 12, height: 12, borderRadius: 3, background: color, border: `1px solid ${borderColor}`, display: 'inline-block' }} />
      {label}
    </div>
  )
}
