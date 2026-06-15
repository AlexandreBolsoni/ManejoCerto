import { NavLink } from 'react-router-dom'
import type { UserProfile } from '../../types'
import { Brand } from '../Brand'

export type MobileAppHeaderProps = {
  user: UserProfile | null
}

export function MobileAppHeader({ user }: MobileAppHeaderProps) {
  return (
    <header className="mobile-app-header">
      <Brand compact to="/dashboard" />
      <NavLink className="avatar-link" to="/conta">
        {user?.initials ?? 'AH'}
      </NavLink>
    </header>
  )
}
