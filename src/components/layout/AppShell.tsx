import { Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentFarm } from '../../hooks/useCurrentFarm'
import { BottomNav } from './BottomNav'
import { MobileAppHeader } from './MobileAppHeader'
import { NimboFooter } from './NimboFooter'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const { farm } = useCurrentFarm()
  const { user } = useAuth()

  return (
    <div className="app-shell">
      <Sidebar farm={farm} user={user} />

      <div className="app-frame">
        <MobileAppHeader user={user} />
        <main className="app-content">
          <Outlet />
          <NimboFooter variant="full" />
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
