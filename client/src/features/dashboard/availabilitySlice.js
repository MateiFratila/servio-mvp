import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  // { 'YYYY-MM-DD': { 'HH:MM': 'available' | 'blocked' | 'booked' } }
  grid: {},
  saved: true,
  weekOffset: 0,
  macroScope: 'week',
  // Tracks whether the grid has been seeded from server at least once.
  // Prevents navigating away and back from wiping unsaved changes.
  initialized: false,
}

export const availabilitySlice = createSlice({
  name: 'availability',
  initialState,
  reducers: {
    // Called whenever server slots load. Full seed on first load; on subsequent
    // calls only syncs newly-booked cells so user edits are preserved.
    initGrid(state, action) {
      const incoming = action.payload // same shape as grid
      if (!state.initialized || state.saved) {
        state.grid = incoming
        state.initialized = true
        state.saved = true
      } else {
        // Keep user edits — only update cells that became booked server-side
        for (const [dk, times] of Object.entries(incoming)) {
          if (!state.grid[dk]) state.grid[dk] = {}
          for (const [t, val] of Object.entries(times)) {
            if (val === 'booked') state.grid[dk][t] = 'booked'
          }
        }
      }
    },
    toggleSlot(state, action) {
      const { dateKey, time } = action.payload
      const current = state.grid[dateKey]?.[time]
      if (current === 'booked') return
      if (!state.grid[dateKey]) state.grid[dateKey] = {}
      state.grid[dateKey][time] = current === 'available' ? 'blocked' : 'available'
      state.saved = false
    },
    // dateKeys: [{ key: 'YYYY-MM-DD', isWeekday: bool }]
    applyMacro(state, action) {
      const { macroAction, dateKeys, timeSlots, macro917Slots } = action.payload
      for (const { key, isWeekday } of dateKeys) {
        if (!state.grid[key]) state.grid[key] = {}
        for (const t of timeSlots) {
          if (state.grid[key][t] === 'booked') continue
          if (macroAction === 'workdays-917') {
            if (isWeekday) state.grid[key][t] = macro917Slots.includes(t) ? 'available' : 'blocked'
          } else if (macroAction === 'fill') {
            state.grid[key][t] = 'available'
          } else if (macroAction === 'clear') {
            state.grid[key][t] = 'blocked'
          }
        }
      }
      state.saved = false
    },
    markSaved(state) {
      state.saved = true
    },
    setWeekOffset(state, action) {
      state.weekOffset = action.payload
    },
    setMacroScope(state, action) {
      state.macroScope = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase('auth/logout', () => {
      return initialState
    })
  },
})

export const {
  initGrid,
  toggleSlot,
  applyMacro,
  markSaved,
  setWeekOffset,
  setMacroScope,
} = availabilitySlice.actions

export const selectAvailabilityGrid = (state) => state.availability.grid
export const selectAvailabilitySaved = (state) => state.availability.saved
export const selectAvailabilityWeekOffset = (state) => state.availability.weekOffset
export const selectAvailabilityMacroScope = (state) => state.availability.macroScope

export default availabilitySlice.reducer
