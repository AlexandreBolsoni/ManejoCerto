import type { ReactNode } from 'react'
import { CloudOff } from 'lucide-react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <article className={`card ${className}`}>{children}</article>
}

export function EmptyState({
  action,
  body,
  title,
}: {
  action?: ReactNode
  body: string
  title: string
}) {
  return (
    <Card className="empty-state">
      <CloudOff size={24} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </Card>
  )
}

export function SkeletonGrid() {
  return (
    <div className="skeleton-grid" aria-label="Carregando dados">
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  )
}

export function OfflineBanner({ staleData }: { staleData: boolean }) {
  if (!staleData) return null

  return (
    <div className="offline-banner">
      <CloudOff size={18} aria-hidden="true" />
      <span>Sem rede no campo: mostrando os últimos dados salvos. Feedbacks entram na fila e sincronizam depois.</span>
    </div>
  )
}
