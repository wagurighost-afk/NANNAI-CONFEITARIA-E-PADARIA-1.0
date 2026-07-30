import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type BadgeVariant = 'default' | 'accent' | 'success' | 'danger' | 'muted'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary',
  accent: 'bg-accent/20 text-accent-foreground',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
  muted: 'bg-muted text-muted-foreground',
}

export function Badge({ className, children, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
