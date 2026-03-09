import { Outlet } from 'react-router-dom'
import Nav from '../components/Nav'

const headerStyle = {
  borderBottom: '1px solid var(--color-lighter)',
  padding: '0 1.5rem',
}

const mainStyle = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '2rem 1.5rem',
}

export default function Layout({ children }) {
  return (
    <>
      <header style={headerStyle}>
        <Nav />
      </header>
      <main style={mainStyle}>
        {children ?? <Outlet />}
      </main>
    </>
  )
}
