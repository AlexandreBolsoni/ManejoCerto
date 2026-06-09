import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ className = '', size = 'md', variant = 'primary', ...props }: ButtonProps) {
  return <button className={`btn ${variant} ${size} ${className}`} {...props} />
}

export function LinkButton({
  children,
  className = '',
  size = 'md',
  to,
  variant = 'primary',
}: {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  to: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}) {
  return (
    <Link className={`btn ${variant} ${size} ${className}`} to={to}>
      {children}
    </Link>
  )
}
