import { Badge } from '@/components/ui'
import {
  PRODUCTION_STATUS_BADGE_VARIANT,
  PRODUCTION_STATUS_LABELS,
} from '@/features/production/constants/productionOptions'
import type { ProductionItemStatus } from '@/features/production/types/production.types'

export interface ProductionStatusBadgeProps {
  status: ProductionItemStatus
}

export function ProductionStatusBadge({ status }: ProductionStatusBadgeProps) {
  return (
    <Badge variant={PRODUCTION_STATUS_BADGE_VARIANT[status]}>
      {PRODUCTION_STATUS_LABELS[status]}
    </Badge>
  )
}
