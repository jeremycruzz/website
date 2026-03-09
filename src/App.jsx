import { Routes, Route } from 'react-router-dom'
import Layout from './app/Layout'
import AboutPage from './features/about/AboutPage'
import ContactPage from './features/contact/ContactPage'
import ProjectsPage from './features/projects/ProjectsPage'
import VocalIsolationPage from './features/projects/VocalIsolationPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/vocal-isolation" element={<VocalIsolationPage />} />
      </Routes>
    </Layout>
  )
}

export default App
