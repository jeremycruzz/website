import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  jobId: null,
  phase: 'idle', // 'idle' | 'processing' | 'downloading'
  progress: 0,
  message: '',
  error: null,
  downloadProgress: null,
}

const vocalIsolationSlice = createSlice({
  name: 'vocalIsolation',
  initialState,
  reducers: {
    setJobStarted(state, action) {
      state.jobId = action.payload
      state.phase = 'processing'
      state.progress = 0
      state.message = 'Separating...'
      state.error = null
      state.downloadProgress = null
    },
    setProgress(state, action) {
      const { progress, message } = action.payload
      if (progress != null) state.progress = progress
      if (message != null) state.message = message
    },
    setPhase(state, action) {
      state.phase = action.payload
    },
    setDownloadProgress(state, action) {
      state.downloadProgress = action.payload
    },
    setError(state, action) {
      state.error = action.payload
      state.phase = 'idle'
      state.jobId = null
    },
    clearError(state) {
      state.error = null
    },
    reset(state) {
      state.jobId = null
      state.phase = 'idle'
      state.progress = 0
      state.message = ''
      state.error = null
      state.downloadProgress = null
    },
  },
})

export const {
  setJobStarted,
  setProgress,
  setPhase,
  setDownloadProgress,
  setError,
  clearError,
  reset,
} = vocalIsolationSlice.actions

export default vocalIsolationSlice.reducer
