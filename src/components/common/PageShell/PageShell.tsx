import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface PageShellProps {
  children: ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return <div className={cn('min-w-0 w-full max-w-full', className)}>{children}</div>
}
