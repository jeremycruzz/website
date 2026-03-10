import { configureStore } from '@reduxjs/toolkit'
import projectsReducer from '../features/projects/projectsSlice'
import vocalIsolationReducer from '../features/projects/vocalIsolationSlice'

export const store = configureStore({
  reducer: {
    projects: projectsReducer,
    vocalIsolation: vocalIsolationReducer,
  },
})
