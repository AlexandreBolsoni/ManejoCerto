import type { HTMLAttributes, ReactNode } from 'react'

export type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <article className={`card ${className}`} {...props}>
      {children}
    </article>
  )
}

export type CardSlotProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function CardHeader({ children, className = '', ...props }: CardSlotProps) {
  return (
    <div className={`card-header ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = '', ...props }: CardSlotProps) {
  return (
    <div className={`card-content ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '', ...props }: CardSlotProps) {
  return (
    <div className={`card-footer ${className}`} {...props}>
      {children}
    </div>
  )
}
