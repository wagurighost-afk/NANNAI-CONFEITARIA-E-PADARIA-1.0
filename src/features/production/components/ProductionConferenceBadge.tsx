import {
  PRODUCTION_CONFERENCE_STATUS_ICONS,
  PRODUCTION_CONFERENCE_STATUS_LABELS,
} from '@/features/production/constants/conferenceOptions'
import { getItemConferenceStatus } from '@/features/production/utils/conference'
import type { ProductionItem } from '@/features/production/types/production.types'

export interface ProductionConferenceBadgeProps {
  item: ProductionItem
  className?: string
}

export function ProductionConferenceBadge({ item, className = '' }: ProductionConferenceBadgeProps) {
  const status = getItemConferenceStatus(item)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-2 py-1 text-xs font-medium text-foreground ${className}`}
    >
      <span aria-hidden>{PRODUCTION_CONFERENCE_STATUS_ICONS[status]}</span>
      <span>{PRODUCTION_CONFERENCE_STATUS_LABELS[status]}</span>
    </span>
  )
}
