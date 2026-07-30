import { Badge } from '@/components/ui'
import type { IngredientCategory } from '@/features/ingredients/types/ingredient.types'

export interface IngredientCategoryBadgeProps {
  category: IngredientCategory
}

export function IngredientCategoryBadge({ category }: IngredientCategoryBadgeProps) {
  return <Badge variant="muted">{category}</Badge>
}
