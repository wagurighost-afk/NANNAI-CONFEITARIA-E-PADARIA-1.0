import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 max-w-full">
        <h1 className="min-w-0 break-words font-display text-2xl text-foreground [overflow-wrap:anywhere] sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
