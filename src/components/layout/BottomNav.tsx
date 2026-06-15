import { NavLink } from 'react-router-dom'
import { bottomNavItems } from './navigation'

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {bottomNavItems.map(({ Icon, label, path }) => (
        <NavLink className={({ isActive }) => (isActive ? 'active' : '')} key={path} to={path}>
          <Icon size={20} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
