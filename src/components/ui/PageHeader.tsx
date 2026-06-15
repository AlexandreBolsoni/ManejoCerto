import type { ReactNode } from 'react'

export type PageHeaderProps = {
  action?: ReactNode
  eyebrow?: string
  subtitle?: string
  title: string
}

export function PageHeader({ action, eyebrow, subtitle, title }: PageHeaderProps) {
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
