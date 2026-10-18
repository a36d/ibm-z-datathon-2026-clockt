import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useClockt } from '../contexts/clocktContext.js'
import { getRecommendations } from '../services/api.js'

const navGroups = [
  {
    label: 'Workspace',
    items: [
      { to: '/', label: 'Overview', icon: 'grid', end: true },
      { to: '/analytics', label: 'Analytics', icon: 'chart' },
      { to: '/activities', label: 'Efficiency Log', icon: 'clock' },
    ],
  },
  {
    label: 'Discover',
    items: [{ to: '/recommendations', label: 'Recommendations', icon: 'spark' }],
  },
]

const paths = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  chart: <><path d="M4 19V5" /><path d="M4 19h17" /><path d="m7 15 4-4 3 2 6-7" /><path d="M16 6h4v4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9L16 21h-3l-.3-1.9a8 8 0 0 1-1.7-.7l-1.7.7-1.4-2.4 1.4-1.2a7 7 0 0 1 0-1.8l-1.4-1.2 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9L13 8h3l.3 1.9a8 8 0 0 1 1.7.7l1.7-.7 1.4 2.4-1.4 1.2a7 7 0 0 1-.3 1.5Z" transform="translate(-1 -2)" /></>,
}

function NavIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function Sidebar() {
  const { workspace } = useClockt()
  const [recommendationsCount, setRecommendationsCount] = useState(null)
  const profileName = typeof workspace?.profile?.fullName === 'string' && workspace.profile.fullName.trim()
    ? workspace.profile.fullName
    : 'Clockt user'
  const profileEmail = typeof workspace?.profile?.email === 'string' && workspace.profile.email.trim()
    ? workspace.profile.email
    : 'Personal account'

  useEffect(() => {
    let isMounted = true

    getRecommendations()
      .then((response) => {
        const recommendations = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
            ? response.items
            : Array.isArray(response?.recommendations)
              ? response.recommendations
              : null
        if (isMounted && recommendations) {
          setRecommendationsCount(
            recommendations.filter((item) => item && typeof item === 'object').length,
          )
        }
      })
      .catch(() => {
        if (isMounted) setRecommendationsCount(null)
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <aside className="sidebar">
      <NavLink to="/" className="brand" aria-label="Clockt home">
        <span className="brand-mark"><span /></span>
        <span>clockt<span className="brand-period">.</span></span>
      </NavLink>

      <nav className="side-nav" aria-label="Main navigation">
        {navGroups.map((group) => (
          <div className="nav-group" key={group.label}>
            <p className="nav-label">{group.label}</p>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                aria-label={item.label}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
                {item.to === '/recommendations' && recommendationsCount !== null && (
                  <span className="nav-count">{recommendationsCount}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-tip">
          <div className="tip-spark"><NavIcon name="spark" /></div>
          <p className="tip-title">Find a better way to work.</p>
          <p className="tip-copy">Save time and improve the quality of the work you do.</p>
        </div>
        <NavLink to="/settings" className={({ isActive }) => `nav-link settings-link${isActive ? ' active' : ''}`}>
          <NavIcon name="settings" />
          <span>Settings</span>
        </NavLink>
        <NavLink to="/account" className="profile-row profile-link" aria-label="Manage account">
          <div className="profile-avatar">{profileName.slice(0, 1).toUpperCase()}</div>
          <div className="profile-copy"><span>{profileName}</span><small>{profileEmail}</small></div>
          <span className="profile-more">···</span>
        </NavLink>
      </div>
    </aside>
  )
}

export default Sidebar
