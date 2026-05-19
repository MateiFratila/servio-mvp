import { useState, useEffect } from 'react'
import { useGetMySlotsQuery, useUpdateMySlotsMutation } from './dashboardApi'

const TIME_SLOTS = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30']
const SLOT_DURATION_MIN = 60

// Build the next 7 dates starting tomorrow
function getUpcomingDates() {
  const dates = []
  for (let i = 1; i <= 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    d.setHours(0, 0, 0, 0)
    dates.push(d)
  }
  return dates
}

function dateKey(date) {
  return date.toISOString().split('T')[0]
}

function slotISO(date, timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

function fmtDateLabel(date) {
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function AvailabilityTab() {
  const dates = getUpcomingDates()
  const { data: serverSlots = [], isLoading } = useGetMySlotsQuery()
  const [updateSlots, { isLoading: saving }] = useUpdateMySlotsMutation()

  // grid: { 'YYYY-MM-DD': { 'HH:MM': 'available' | 'blocked' | 'booked' } }
  const [grid, setGrid] = useState({})
  const [saved, setSaved] = useState(false)

  // Populate grid from server data when it loads
  useEffect(() => {
    const initial = {}
    for (const date of dates) {
      const key = dateKey(date)
      initial[key] = {}
      for (const time of TIME_SLOTS) {
        const iso = slotISO(date, time)
        const match = serverSlots.find((s) => new Date(s.startTime).toISOString() === iso)
        if (match) {
          initial[key][time] = match.isBooked ? 'booked' : 'available'
        } else {
          initial[key][time] = 'blocked'
        }
      }
    }
    setGrid(initial)
    setSaved(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSlots])

  function toggle(dateKey, time) {
    setGrid((prev) => {
      const current = prev[dateKey]?.[time]
      if (current === 'booked') return prev
      return {
        ...prev,
        [dateKey]: { ...prev[dateKey], [time]: current === 'available' ? 'blocked' : 'available' },
      }
    })
    setSaved(false)
  }

  async function handleSave() {
    const slots = []
    for (const date of dates) {
      const key = dateKey(date)
      for (const time of TIME_SLOTS) {
        if (grid[key]?.[time] === 'available') {
          const start = new Date(slotISO(date, time))
          const end = new Date(start.getTime() + SLOT_DURATION_MIN * 60000)
          slots.push({ startTime: start.toISOString(), endTime: end.toISOString() })
        }
      }
    }
    await updateSlots({ slots })
    setSaved(true)
  }

  function cellStyle(value) {
    if (value === 'booked') return { background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid #bfdbfe', cursor: 'default' }
    if (value === 'available') return { background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid #bbf7d0', cursor: 'pointer' }
    return { background: 'var(--grey-bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer' }
  }

  if (isLoading) return <div className="card"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>Availability — Next 7 Days</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Legend color="var(--green-bg)" borderColor="#bbf7d0" label="Available" />
          <Legend color="var(--grey-bg)" borderColor="var(--border)" label="Blocked" />
          <Legend color="var(--blue-bg)" borderColor="#bfdbfe" label="Booked" />
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Availability'}
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 4 }}>
          <thead>
            <tr>
              <th style={{ width: 110 }}></th>
              {TIME_SLOTS.map((t) => (
                <th key={t} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 8px' }}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.map((date) => {
              const key = dateKey(date)
              return (
                <tr key={key}>
                  <td style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', paddingRight: 8, whiteSpace: 'nowrap' }}>{fmtDateLabel(date)}</td>
                  {TIME_SLOTS.map((time) => {
                    const val = grid[key]?.[time] ?? 'blocked'
                    return (
                      <td
                        key={time}
                        onClick={() => toggle(key, time)}
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
                        {val === 'booked' ? '●' : val === 'available' ? 'Open' : 'Off'}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
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
