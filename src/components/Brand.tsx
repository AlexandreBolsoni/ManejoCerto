import { Link } from 'react-router-dom'
import { APP_NAME, APP_SLOGAN } from '../config/brand'

export function Brand({ to = '/', compact = false }: { to?: string; compact?: boolean }) {
  return (
    <Link className={`brand-link ${compact ? 'compact' : ''}`} to={to}>
      <img src="/assets/nimbo-mark.svg" alt="" />
      <span>{APP_NAME}</span>
    </Link>
  )
}

export function FullLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`full-logo ${className}`} aria-label={`${APP_NAME} — ${APP_SLOGAN}`}>
      <img src="/assets/nimbo-mark.svg" alt="" />
      <div>
        <strong>{APP_NAME}</strong>
        <span>{APP_SLOGAN}</span>
      </div>
    </div>
  )
}
