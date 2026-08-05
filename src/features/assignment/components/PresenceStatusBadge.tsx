import {
  ASSIGNMENT_PRESENCE_LABELS,
  ASSIGNMENT_PRESENCE_STYLES,
} from '@/features/assignment/constants/assignment.constants'
import type { AssignmentPresenceStatus } from '@/features/assignment/types/assignment.types'
import { cn } from '@/utils/cn'

export interface PresenceStatusBadgeProps {
  status: AssignmentPresenceStatus
  className?: string
}

export function PresenceStatusBadge({ status, className }: PresenceStatusBadgeProps) {
  const styles = ASSIGNMENT_PRESENCE_STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        styles.badge,
        className,
      )}
    >
      <span className={cn('size-2 rounded-full', styles.dot)} aria-hidden />
      {ASSIGNMENT_PRESENCE_LABELS[status]}
    </span>
  )
}
