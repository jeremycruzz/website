import { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const navStyle = {
  display: 'flex',
  gap: '1.5rem',
  listStyle: 'none',
  margin: 0,
  padding: '1rem 0',
}

const linkStyle = {
  color: 'var(--color-dark)',
  fontWeight: 500,
  textDecoration: 'none',
}

const activeStyle = {
  color: 'var(--color-main)',
  textDecoration: 'underline',
}

const projectLinks = [
  { to: '/projects/vocal-isolation', label: 'Vocal Isolation' },
]

export default function Nav() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const location = useLocation()

  const isProjectsActive = location.pathname === '/projects' || location.pathname.startsWith('/projects/')

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <nav>
      <ul className="nav-list" style={navStyle}>
        <li>
          <NavLink
            to="/"
            className="nav-link"
            style={({ isActive }) => (isActive ? { ...linkStyle, ...activeStyle } : linkStyle)}
          >
            Home
          </NavLink>
        </li>
        <li className="nav-dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="nav-link nav-dropdown-trigger"
            style={isProjectsActive ? { ...linkStyle, ...activeStyle } : linkStyle}
            onClick={() => setDropdownOpen((o) => !o)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            Projects
          </button>
          {dropdownOpen && (
            <ul className="nav-dropdown-menu">
              {projectLinks.map(({ to, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className="nav-link"
                    style={({ isActive }) => (isActive ? { ...linkStyle, ...activeStyle } : linkStyle)}
                    onClick={() => setDropdownOpen(false)}
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </li>
        <li>
          <NavLink
            to="/contact"
            className="nav-link"
            style={({ isActive }) => (isActive ? { ...linkStyle, ...activeStyle } : linkStyle)}
          >
            Contact
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}
