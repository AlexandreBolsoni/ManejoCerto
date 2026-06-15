import type { ReactNode } from 'react'
import { CloudOff } from 'lucide-react'
import type { AsyncStatus } from '../../types/async.types'
import { Card } from './Card'

export type DataStateProps = {
  children: ReactNode
  empty?: boolean
  emptyState?: ReactNode
  error?: string | null
  errorState?: ReactNode
  loadingState?: ReactNode
  status: AsyncStatus
}

export function DataState({
  children,
  empty = false,
  emptyState,
  error,
  errorState,
  loadingState,
  status,
}: DataStateProps) {
  if (status === 'loading') {
    return loadingState ?? <SkeletonGrid />
  }

  if (status === 'error') {
    return errorState ?? <EmptyState body={error ?? 'Tente atualizar os dados em alguns instantes.'} title="Nao foi possivel carregar" />
  }

  if (empty) {
    return emptyState ?? <EmptyState body="Ainda nao ha dados para exibir." title="Nenhum dado encontrado" />
  }

  return children
}

export type EmptyStateProps = {
  action?: ReactNode
  body: string
  title: string
}

export function EmptyState({ action, body, title }: EmptyStateProps) {
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

export type OfflineBannerProps = {
  staleData: boolean
}

export function OfflineBanner({ staleData }: OfflineBannerProps) {
  if (!staleData) return null

  return (
    <div className="offline-banner">
      <CloudOff size={18} aria-hidden="true" />
      <span>Sem rede no campo: mostrando os últimos dados salvos. Feedbacks entram na fila e sincronizam depois.</span>
    </div>
  )
}
