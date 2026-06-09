import type { ReactNode } from 'react'

export function PageHeader({
  action,
  eyebrow,
  subtitle,
  title,
}: {
  action?: ReactNode
  eyebrow?: string
  subtitle?: string
  title: string
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="page-action">{action}</div>}
    </header>
  )
}
