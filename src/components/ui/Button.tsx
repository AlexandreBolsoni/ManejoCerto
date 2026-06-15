import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ className = '', size = 'md', variant = 'primary', ...props }: ButtonProps) {
  return <button className={`btn ${variant} ${size} ${className}`} {...props} />
}

export type LinkButtonProps = {
  children: ReactNode
  className?: string
  size?: ButtonSize
  to: string
  variant?: ButtonVariant
}

export function LinkButton({
  children,
  className = '',
  size = 'md',
  to,
  variant = 'primary',
}: LinkButtonProps) {
  return (
    <Link className={`btn ${variant} ${size} ${className}`} to={to}>
      {children}
    </Link>
  )
}

export type IconButtonProps = ButtonProps & {
  label: string
}

export function IconButton({ className = '', label, ...props }: IconButtonProps) {
  return <Button aria-label={label} className={`icon-button ${className}`} {...props} />
}
