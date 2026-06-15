import type { ReactNode } from 'react'
import type { Severity } from '../../types'

export type BadgeTone = 'green' | 'red' | 'amber' | 'soft' | Severity

export type BadgeProps = {
  children: ReactNode
  tone?: BadgeTone
}

export function Badge({ children, tone = 'green' }: BadgeProps) {
  return <span className={`badge ${tone}`}>{children}</span>
}
