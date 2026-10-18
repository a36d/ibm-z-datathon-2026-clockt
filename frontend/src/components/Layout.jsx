import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import '../styles/app.css'

function Layout() {
  const { pathname } = useLocation()
  const isOverview = pathname === '/'
  const hasDashboardTint = ['/analytics', '/activities', '/recommendations', '/settings', '/account'].includes(pathname)

  return (
    <div className="app-shell">
      <Sidebar />
      <div className={`app-main${hasDashboardTint ? ' dashboard-tint' : ''}`}>
        <main className={`page-content${isOverview ? ' overview-content' : ''}`}>
          <Outlet />
        </main>
        {!isOverview && <footer className="app-footer">Clockt <span>·</span> Your time, thoughtfully managed</footer>}
      </div>
    </div>
  )
}

export default Layout
