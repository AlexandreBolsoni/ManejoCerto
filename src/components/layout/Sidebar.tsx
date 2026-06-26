import { ChevronDown } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { Farm, UserProfile } from '../../types'
import'../../../public/assets/icone.png'
import { sideNavItems } from './navigation'

export type SidebarProps = {
  farm: Farm | null
  user: UserProfile | null
}

export function Sidebar({ farm, user }: SidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <img src="/assets/logo-branca.png" alt="Logo" className="logo" />
      </div>
      <nav className="sidebar-nav" aria-label="Navegação principal">
        {sideNavItems.map(({ Icon, label, path }) => (
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
            <strong>{user?.name ?? 'Faça Login'}</strong>
            <small>{farm?.name ?? 'Não cadastraddo'}</small>
          </div>
          <ChevronDown size={14} aria-hidden="true" />
        </NavLink>
      </div>
    </aside>
  )
}
