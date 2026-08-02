import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useId, useState } from 'react'
import { cn } from '@/utils/cn'

export interface CollapsibleSectionProps {
  title: string
  icon?: ReactNode
  badge?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  className?: string
  /** Kitchen-friendly large touch target */
  kitchenMode?: boolean
}

export function CollapsibleSection({
  title,
  icon,
  badge,
  defaultOpen = false,
  children,
  className,
  kitchenMode = false,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <section className={cn('overflow-hidden rounded-2xl border border-border bg-surface-elevated', className)}>
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-3 text-left transition hover:bg-muted/40',
          kitchenMode ? 'min-h-[52px] px-4 py-4' : 'px-4 py-3',
        )}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        {icon ? <span className="shrink-0 text-accent">{icon}</span> : null}
        <span className={cn('flex-1 font-semibold text-foreground', kitchenMode && 'text-base')}>{title}</span>
        {badge}
        <ChevronDown
          className={cn('size-5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>
      {open ? (
        <div id={panelId} className={cn('border-t border-border', kitchenMode ? 'px-4 py-4' : 'px-4 py-3')}>
          {children}
        </div>
      ) : null}
    </section>
  )
}
