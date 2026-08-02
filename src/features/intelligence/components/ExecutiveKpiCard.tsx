import { memo, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Badge } from '@/components/ui'
import {
  EXECUTIVE_PRIORITY_CARD_STYLES,
  SMART_PRIORITY_BADGE_VARIANT,
  SMART_PRIORITY_LABELS,
} from '@/features/intelligence/constants/priority.constants'
import type { SmartInsightPriority } from '@/features/intelligence/types/smartInsights.types'
import { cn } from '@/utils/cn'

export interface ExecutiveKpiCardProps {
  label: string
  value: string
  description?: string
  priority: SmartInsightPriority
  icon: ReactNode
  className?: string
}

export const ExecutiveKpiCard = memo(function ExecutiveKpiCard({
  label,
  value,
  description,
  priority,
  icon,
  className,
}: ExecutiveKpiCardProps) {
  const styles = EXECUTIVE_PRIORITY_CARD_STYLES[priority]
  const prefersReducedMotion = useReducedMotion()
  const ariaLabel = `${label}: ${value}. Prioridade ${SMART_PRIORITY_LABELS[priority]}.${description ? ` ${description}` : ''}`

  return (
    <motion.article
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
      aria-label={ariaLabel}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md',
        styles.card,
        className,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-1',
          priority === 'critico' && 'bg-danger',
          priority === 'alto' && 'bg-accent',
          priority === 'medio' && 'bg-primary/60',
          priority === 'baixo' && 'bg-success/50',
        )}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className={cn('mt-2 font-display text-3xl tabular-nums tracking-tight', styles.accent)}>
            {value}
          </p>
          {description ? (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className={cn('shrink-0 rounded-xl p-2.5', styles.icon)} aria-hidden>
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Badge variant={SMART_PRIORITY_BADGE_VARIANT[priority]}>{SMART_PRIORITY_LABELS[priority]}</Badge>
      </div>
    </motion.article>
  )
})
