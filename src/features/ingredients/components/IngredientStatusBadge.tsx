import { Badge } from '@/components/ui'
import {
  INGREDIENT_STATUS_BADGE_VARIANT,
  INGREDIENT_STATUS_LABELS,
} from '@/features/ingredients/constants/ingredientOptions'
import type { IngredientStatus } from '@/features/ingredients/types/ingredient.types'

export interface IngredientStatusBadgeProps {
  status: IngredientStatus
}

export function IngredientStatusBadge({ status }: IngredientStatusBadgeProps) {
  return (
    <Badge variant={INGREDIENT_STATUS_BADGE_VARIANT[status]}>
      {INGREDIENT_STATUS_LABELS[status]}
    </Badge>
  )
}
