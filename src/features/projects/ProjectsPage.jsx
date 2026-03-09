import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProjects } from './projectsSlice'
import ProjectCard from '../../components/ProjectCard'

export default function ProjectsPage() {
  const dispatch = useDispatch()
  const { items, loading, error } = useSelector((state) => state.projects)

  useEffect(() => {
    dispatch(fetchProjects())
  }, [dispatch])

  if (loading) {
    return <p style={{ color: 'var(--color-lighter)' }}>Loading projects…</p>
  }

  if (error) {
    return (
      <p style={{ color: 'var(--color-dark)' }}>
        Could not load projects: {error}
      </p>
    )
  }

  if (!items?.length) {
    return (
      <p style={{ color: 'var(--color-lighter)' }}>
        No projects yet. Connect a backend that serves <code>GET /api/projects</code>.
      </p>
    )
  }

  return (
    <section>
      <h1>Projects</h1>
      <p style={{ color: 'var(--color-lighter)', marginBottom: '1.5rem' }}>
        Vocal isolation and other audio models.
      </p>
      {items.map((project) => (
        <ProjectCard key={project.id ?? project.name} project={project} />
      ))}
    </section>
  )
}
