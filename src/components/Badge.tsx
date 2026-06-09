import type { ReactNode } from 'react'
import type { Severity } from '../types'

export function Badge({
  children,
  tone = 'green',
}: {
  children: ReactNode
  tone?: 'green' | 'red' | 'amber' | 'soft' | Severity
}) {
  return <span className={`badge ${tone}`}>{children}</span>
}
