import { memo, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EXECUTIVE_TONE_STYLES } from '@/features/executive-panel/constants/executivePanel.constants'
import type { ExecutiveStatusTone } from '@/features/executive-panel/types/executivePanel.types'
import { cn } from '@/utils/cn'

export interface ExecutiveMetricCardProps {
  label: string
  value: string
  description?: string
  tone?: ExecutiveStatusTone
  icon?: ReactNode
  className?: string
}

export const ExecutiveMetricCard = memo(function ExecutiveMetricCard({
  label,
  value,
  description,
  tone = 'neutral',
  icon,
  className,
}: ExecutiveMetricCardProps) {
  const styles = EXECUTIVE_TONE_STYLES[tone]
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.article
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}
      className={cn(
        'rounded-2xl border p-4 shadow-sm',
        styles.card,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={cn('mt-2 font-display text-2xl tabular-nums tracking-tight sm:text-3xl', styles.value)}>
            {value}
          </p>
          {description ? (
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {icon ? (
          <div className="rounded-xl bg-background/70 p-2 text-muted-foreground" aria-hidden>
            {icon}
          </div>
        ) : null}
      </div>
    </motion.article>
  )
})
