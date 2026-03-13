import { Link } from 'react-router-dom'

const twoColStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '2rem',
  flexWrap: 'wrap',
  marginBottom: '1.5rem',
}

const textColStyle = {
  flex: '1 1 280px',
  minWidth: 0,
}

const photoColStyle = {
  flex: '0 0 auto',
}

const dividerStyle = {
  height: 1,
  margin: '1.25rem 0',
  background: 'var(--color-lighter)',
  opacity: 0.4,
  border: 'none',
}

export default function AboutPage() {
  return (
    <article>
      <div style={twoColStyle}>
        <div style={textColStyle}>
          <h1 style={{ marginTop: 0 }}>Jeremy Cruz</h1>
          <p>
            Welcome. I build tools and models, including vocal isolation and audio processing.
            This site hosts my projects and a bit about what I'm working on.
          </p>
          <p style={{ marginTop: 0, color: 'var(--color-lighter)' }}>
            Currently working on improving my vocal isolation models.
          </p>
          <hr style={dividerStyle} />
          <p style={{ marginTop: 0 }}>
            <a href="/resume_2025-11.pdf" download>
              Download my resume
            </a>
          </p>
          <hr style={dividerStyle} />
          <p style={{ marginTop: 0 }}>
            <Link to="/contact">Get in touch</Link>
          </p>
        </div>
        <div style={photoColStyle}>
          <img
            src="/headshot.png"
            alt="Jeremy Cruz"
            style={{
              display: 'block',
              width: 180,
              height: 180,
              objectFit: 'contain',
            }}
          />
        </div>
      </div>
    </article>
  )
}
