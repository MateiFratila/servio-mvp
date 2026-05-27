import { createSlice } from '@reduxjs/toolkit'

const langSlice = createSlice({
  name: 'lang',
  initialState: { language: 'ro' },
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload
    },
  },
})

export const { setLanguage } = langSlice.actions
export const selectLanguage = (state) => state.lang.language
export default langSlice.reducer
