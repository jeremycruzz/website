import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getProjects } from '../../app/api'

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getProjects()
      return data.projects ?? data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

const initialState = {
  items: [],
  loading: false,
  error: null,
}

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false
        state.error = null
        state.items = action.payload ?? []
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Failed to load projects'
        state.items = []
      })
  },
})

export default projectsSlice.reducer
