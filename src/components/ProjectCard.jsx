const cardStyle = {
  border: '1px solid var(--color-lighter)',
  borderRadius: 8,
  padding: '1rem 1.25rem',
  marginBottom: '1rem',
  backgroundColor: 'var(--color-base)',
}

const titleStyle = {
  margin: '0 0 0.5rem',
  color: 'var(--color-main)',
  fontSize: '1.125rem',
}

const descStyle = {
  margin: '0 0 0.75rem',
  color: 'var(--color-dark)',
  fontSize: '0.9375rem',
}

const linkStyle = {
  color: 'var(--color-accent)',
  fontSize: '0.875rem',
}

export default function ProjectCard({ project }) {
  const { name, description, link, tags } = project
  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>{name}</h3>
      {description && <p style={descStyle}>{description}</p>}
      {tags?.length > 0 && (
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: 'var(--color-lighter)' }}>
          {tags.join(' · ')}
        </p>
      )}
      {link && (
        <a href={link} target="_blank" rel="noreferrer" style={linkStyle}>
          View project
        </a>
      )}
    </div>
  )
}
