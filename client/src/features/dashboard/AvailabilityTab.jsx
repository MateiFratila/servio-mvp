import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useGetMySlotsQuery, useUpdateMySlotsMutation } from './dashboardApi'
import { useLabels } from '../../lib/useLabels'
import {
  initGrid,
  toggleSlot,
  applyMacro,
  markSaved,
  setWeekOffset,
  setMacroScope,
  selectAvailabilityGrid,
  selectAvailabilitySaved,
  selectAvailabilityWeekOffset,
  selectAvailabilityMacroScope,
} from './availabilitySlice'

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30'
]
const SLOT_DURATION_MIN = 30
const MAX_WEEKS = 13 // fiscal quarter (~3 months)
const EMPTY_ARRAY = []

// Slots covered by the "9-17" macro (start hours >= 9 and < 17)
const MACRO_917_SLOTS = TIME_SLOTS.filter((t) => {
  const [h] = t.split(':').map(Number)
  return h >= 9 && h < 17
})

function getMonday(weekOffset = 0) {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day // shift to Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getWeekDates(weekOffset) {
  const monday = getMonday(weekOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function dateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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

function fmtWeekRange(weekOffset) {
  const days = getWeekDates(weekOffset)
  const opts = { month: 'short', day: 'numeric' }
  const start = days[0].toLocaleDateString([], opts)
  const end = days[6].toLocaleDateString([], { ...opts, year: 'numeric' })
  return `${start} – ${end}`
}

export default function AvailabilityTab() {
  const L = useLabels().availabilityTab
  const dispatch = useDispatch()
  const { data: serverSlots = EMPTY_ARRAY, isLoading } = useGetMySlotsQuery()
  const [updateSlots, { isLoading: saving }] = useUpdateMySlotsMutation()

  const grid = useSelector(selectAvailabilityGrid)
  const saved = useSelector(selectAvailabilitySaved)
  const weekOffset = useSelector(selectAvailabilityWeekOffset)
  const macroScope = useSelector(selectAvailabilityMacroScope)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const allDates = useMemo(() => {
    const all = []
    for (let w = 0; w < MAX_WEEKS; w++) all.push(...getWeekDates(w))
    return all
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])

  // Seed Redux grid from server data. On first load does a full init;
  // on subsequent fetches (e.g. after save) only syncs booked slots.
  useEffect(() => {
    const computed = {}
    for (const date of allDates) {
      const key = dateKey(date)
      computed[key] = {}
      for (const time of TIME_SLOTS) {
        const iso = slotISO(date, time)
        const match = serverSlots.find((s) => new Date(s.startTime).toISOString() === iso)
        computed[key][time] = match ? (match.isBooked ? 'booked' : 'available') : 'blocked'
      }
    }
    dispatch(initGrid(computed))
  }, [serverSlots, allDates, dispatch])

  function toggle(dKey, time) {
    dispatch(toggleSlot({ dateKey: dKey, time }))
  }

  function handleApplyMacro(macroAction) {
    const targetDates = macroScope === 'all' ? allDates : weekDates
    const dateKeys = targetDates
      .filter((date) => date >= today)
      .map((date) => ({ key: dateKey(date), isWeekday: date.getDay() >= 1 && date.getDay() <= 5 }))
    dispatch(applyMacro({ macroAction, dateKeys, timeSlots: TIME_SLOTS, macro917Slots: MACRO_917_SLOTS }))
  }

  async function handleSave() {
    const slots = []
    const now = new Date()
    for (const date of allDates) {
      const key = dateKey(date)
      for (const time of TIME_SLOTS) {
        if (grid[key]?.[time] === 'available') {
          const start = new Date(slotISO(date, time))
          if (start >= now) {
            const end = new Date(start.getTime() + SLOT_DURATION_MIN * 60000)
            slots.push({ startTime: start.toISOString(), endTime: end.toISOString() })
          }
        }
      }
    }
    try {
      await updateSlots({ slots }).unwrap()
      dispatch(markSaved())
    } catch (err) {
      console.error('Failed to save slots:', err)
    }
  }

  function cellStyle(value) {
    if (value === 'booked') return { background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid #bfdbfe', cursor: 'default' }
    if (value === 'available') return { background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid #bbf7d0', cursor: 'pointer' }
    return { background: 'var(--grey-bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer' }
  }

  if (isLoading) return <div className="card"><p style={{ color: 'var(--text-muted)' }}>{L.loading}</p></div>

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>{L.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!saved && !saving && (
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--warning, #d97706)' }}>
              <strong>{L.unsavedHint}</strong>
            </span>
          )}
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saved ? L.saved : saving ? L.saving : L.save}
          </button>
        </div>
      </div>

      {/* Macros bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '10px 12px', background: 'var(--grey-bg)', borderRadius: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 }}>{L.quickFill}</span>
        <button className="btn btn-sm" onClick={() => handleApplyMacro('workdays-917')}>{L.macro917}</button>
        <button className="btn btn-sm" onClick={() => handleApplyMacro('fill')}>{L.macroFillAll}</button>
        <button className="btn btn-sm" onClick={() => handleApplyMacro('clear')}>{L.macroClear}</button>
        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{L.applyTo}</span>
        <button
          className={`btn btn-sm${macroScope === 'week' ? ' btn-primary' : ''}`}
          onClick={() => dispatch(setMacroScope('week'))}
        >
          {L.thisWeek}
        </button>
        <button
          className={`btn btn-sm${macroScope === 'all' ? ' btn-primary' : ''}`}
          onClick={() => dispatch(setMacroScope('all'))}
        >
          {L.allWeeks(MAX_WEEKS)}
        </button>
      </div>

      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button className="btn btn-sm" onClick={() => dispatch(setWeekOffset(Math.max(0, weekOffset - 1)))} disabled={weekOffset === 0}>
          {L.prev}
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', minWidth: 220, textAlign: 'center' }}>
          {L.weekLabel(weekOffset + 1, MAX_WEEKS, fmtWeekRange(weekOffset))}
        </span>
        <button className="btn btn-sm" onClick={() => dispatch(setWeekOffset(Math.min(MAX_WEEKS - 1, weekOffset + 1)))} disabled={weekOffset === MAX_WEEKS - 1}>
          {L.next}
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <Legend color="var(--green-bg)" borderColor="#bbf7d0" label={L.legend.available} />
          <Legend color="var(--grey-bg)" borderColor="var(--border)" label={L.legend.blocked} />
          <Legend color="var(--blue-bg)" borderColor="#bfdbfe" label={L.legend.booked} />
        </div>
      </div>

      {/* Grid */}
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
            {weekDates.map((date) => {
              const key = dateKey(date)
              const isPast = date < today
              const isToday = date.toDateString() === today.toDateString()
              return (
                <tr key={key} style={{ opacity: isPast ? 0.45 : 1 }}>
                  <td style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', paddingRight: 8, whiteSpace: 'nowrap' }}>
                    {fmtDateLabel(date)}
                    {isToday && (
                      <span style={{ marginLeft: 5, fontSize: 10, color: 'var(--green)', background: 'var(--green-bg)', borderRadius: 4, padding: '1px 5px' }}>
                        {L.today}
                      </span>
                    )}
                  </td>
                  {TIME_SLOTS.map((time) => {
                    const val = grid[key]?.[time] ?? 'blocked'
                    const slotPast = new Date(slotISO(date, time)) < new Date()
                    return (
                      <td
                        key={time}
                        onClick={() => !slotPast && toggle(key, time)}
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
                          ...(slotPast ? { cursor: 'default', opacity: 0.45 } : {}),
                        }}
                      >
                        {val === 'booked' ? '●' : val === 'available' ? L.cellOpen : L.cellOff}
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
