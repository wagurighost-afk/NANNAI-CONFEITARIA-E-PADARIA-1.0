import type { SystemBadge } from '@/types/auth.types'
import { SYSTEM_BADGE_LABELS } from '@/core/auth/roles'
import { cn } from '@/utils/cn'

export interface FounderBadgeProps {
  className?: string
  size?: 'sm' | 'md'
}

export function FounderBadge({ className, size = 'md' }: FounderBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 font-semibold text-amber-700 dark:text-amber-300',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className,
      )}
      title={SYSTEM_BADGE_LABELS.founder}
    >
      <span aria-hidden>👑</span>
      {SYSTEM_BADGE_LABELS.founder}
    </span>
  )
}

export interface SystemBadgesProps {
  badges: SystemBadge[]
  className?: string
  size?: 'sm' | 'md'
}

export function SystemBadges({ badges, className, size = 'md' }: SystemBadgesProps) {
  if (badges.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {badges.includes('founder') ? <FounderBadge size={size} /> : null}
    </div>
  )
}
