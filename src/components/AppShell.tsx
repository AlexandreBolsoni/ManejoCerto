import { Bell, ChartNoAxesColumnIncreasing, ChevronDown, CloudRain, House, Radar, Sprout } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData'
import { useAuth } from '../hooks/useAuth'
import { Brand } from './Brand'

const navItems = [
  { label: 'Hoje', path: '/dashboard', Icon: House },
  { label: 'Radar', path: '/mapa', Icon: Radar },
  { label: 'Áreas', path: '/talhoes', Icon: Sprout },
  { label: 'Alertas', path: '/alertas', Icon: Bell },
  { label: 'Mercado', path: '/mercado', Icon: ChartNoAxesColumnIncreasing },
]

export function AppShell() {
  const { farm } = useAppData()
  const { user } = useAuth()

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <Brand to="/dashboard" />
        </div>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navItems.map(({ Icon, label, path }) => (
            <NavLink className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`} key={path} to={path}>
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <NavLink className={({ isActive }) => `sidebar-profile ${isActive ? 'active' : ''}`} to="/conta">
            <span>{user?.initials ?? 'AH'}</span>
            <div>
              <strong>{user?.name ?? 'Alexandre'}</strong>
              <small>{farm?.name ?? 'hackbarflt'}</small>
            </div>
            <ChevronDown size={14} aria-hidden="true" />
          </NavLink>
        </div>
      </aside>

      <div className="app-frame">
        <header className="mobile-app-header">
          <Brand compact to="/dashboard" />
          <NavLink className="avatar-link" to="/conta">
            {user?.initials ?? 'AH'}
          </NavLink>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>

      <NavLink className="feedback-fab" to="/feedback" title="Registrar feedback local">
        <CloudRain size={24} aria-hidden="true" />
      </NavLink>

      <nav className="bottom-nav" aria-label="Navegação mobile">
        {navItems.map(({ Icon, label, path }) => (
          <NavLink className={({ isActive }) => (isActive ? 'active' : '')} key={path} to={path}>
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
