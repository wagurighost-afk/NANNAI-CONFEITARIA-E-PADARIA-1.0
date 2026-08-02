import type { SmartAlertPriority } from '@/features/intelligence/types/smartAlerts.types'
import {
  SMART_ALERT_PRIORITY_ICON,
  SMART_ALERT_PRIORITY_STYLES,
} from '@/features/intelligence/constants/alert.constants'
import { cn } from '@/utils/cn'

export interface AlertPriorityIconProps {
  priority: SmartAlertPriority
  className?: string
  size?: 'sm' | 'md'
}

export function AlertPriorityIcon({ priority, className, size = 'md' }: AlertPriorityIconProps) {
  const Icon = SMART_ALERT_PRIORITY_ICON[priority]
  const styles = SMART_ALERT_PRIORITY_STYLES[priority]
  const iconSize = size === 'sm' ? 'size-4' : 'size-5'
  const boxSize = size === 'sm' ? 'size-8' : 'size-10'

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl',
        boxSize,
        styles.bg,
        className,
      )}
      aria-hidden
    >
      <Icon className={cn(iconSize, styles.icon)} />
    </span>
  )
}
