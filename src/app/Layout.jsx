import { Outlet } from 'react-router-dom'
import Nav from '../components/Nav'

const contentWidth = 720
const contentPadding = '1.5rem'

const headerStyle = {
  borderBottom: '1px solid var(--color-lighter)',
}

const headerInnerStyle = {
  maxWidth: contentWidth,
  margin: '0 auto',
  padding: `0 ${contentPadding}`,
}

const mainStyle = {
  maxWidth: contentWidth,
  margin: '0 auto',
  padding: `2rem ${contentPadding}`,
}

export default function Layout({ children }) {
  return (
    <>
      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <Nav />
        </div>
      </header>
      <main style={mainStyle}>
        {children ?? <Outlet />}
      </main>
    </>
  )
}
