import { Bell, ChartNoAxesColumnIncreasing, House, Radar, Sprout, UserRound, type LucideIcon } from 'lucide-react'

export type NavItem = {
  label: string
  path: string
  Icon: LucideIcon
}

export const sideNavItems: NavItem[] = [
  { label: 'Início', path: '/dashboard', Icon: House },
  { label: 'Radar', path: '/mapa', Icon: Radar },
  { label: 'Áreas', path: '/talhoes', Icon: Sprout },
  { label: 'Mercado', path: '/mercado', Icon: ChartNoAxesColumnIncreasing },
  { label: 'Alertas', path: '/alertas', Icon: Bell },
]

export const bottomNavItems: NavItem[] = [
  { label: 'Início', path: '/dashboard', Icon: House },
  { label: 'Radar', path: '/mapa', Icon: Radar },
  { label: 'Mercado', path: '/mercado', Icon: ChartNoAxesColumnIncreasing },
  { label: 'Alertas', path: '/alertas', Icon: Bell },
  { label: 'Perfil', path: '/conta', Icon: UserRound },
]
