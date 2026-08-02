import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface PageShellProps {
  children: ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return <div className={cn(className)}>{children}</div>
}
