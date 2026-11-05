import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface ButtonProps {
  as?: 'button' | 'link' | 'a'
  variant?: 'primary' | 'outline'
  className?: string
  children: ReactNode
  to?: string
  href?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  disabled?: boolean
}

interface TextLinkProps {
  as?: 'link' | 'a'
  className?: string
  children: ReactNode
  to?: string
  href?: string
  target?: string
  rel?: string
}

export function Button({ as = 'button', variant = 'primary', className = '', children, to, href, type = 'button', onClick, disabled = false }: ButtonProps) {
  const classes = `button button-${variant} ${className}`.trim()
  if (as === 'link') return <Link className={classes} to={to || '/'}>{children}</Link>
  if (as === 'a') return <a className={classes} href={href || '#'}>{children}</a>
  return <button className={classes} disabled={disabled} onClick={onClick} type={type}>{children}</button>
}

export function TextLink({ as = 'link', className = '', children, to, href, target, rel }: TextLinkProps) {
  const classes = `text-link ${className}`.trim()
  if (as === 'a') return <a className={classes} href={href || '#'} rel={rel} target={target}>{children}</a>
  return <Link className={classes} to={to || '/'}>{children}</Link>
}
