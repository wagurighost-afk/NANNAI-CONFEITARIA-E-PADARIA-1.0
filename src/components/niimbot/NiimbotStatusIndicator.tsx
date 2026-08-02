import { cn } from '@/utils/cn'
import type { NiimbotConnectionStatus } from '@/services/niimbot/types'

const STATUS_UI: Record<
  NiimbotConnectionStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  connected: {
    label: '🟢 Conectada',
    dotClass: 'bg-success',
    textClass: 'text-success',
  },
  connecting: {
    label: '🟡 Conectando',
    dotClass: 'bg-amber-400 animate-pulse',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  disconnected: {
    label: '🔴 Desconectada',
    dotClass: 'bg-danger',
    textClass: 'text-danger',
  },
}

export interface NiimbotStatusIndicatorProps {
  status: NiimbotConnectionStatus
  className?: string
  showLabel?: boolean
}

export function NiimbotStatusIndicator({
  status,
  className,
  showLabel = true,
}: NiimbotStatusIndicatorProps) {
  const ui = STATUS_UI[status]

  return (
    <span
      className={cn('inline-flex items-center gap-2 text-sm font-medium', ui.textClass, className)}
      role="status"
      aria-live="polite"
    >
      <span className={cn('size-2.5 rounded-full', ui.dotClass)} aria-hidden />
      {showLabel ? <span>{ui.label}</span> : <span className="sr-only">{ui.label}</span>}
    </span>
  )
}
