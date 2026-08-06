import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface ExecutiveSectionProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function ExecutiveSection({
  title,
  description,
  action,
  children,
  className,
}: ExecutiveSectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl tracking-tight text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
