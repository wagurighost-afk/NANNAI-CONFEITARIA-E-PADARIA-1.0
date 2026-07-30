import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { IngredientCategoryBadge } from '@/features/ingredients/components/IngredientCategoryBadge'
import { IngredientStatusBadge } from '@/features/ingredients/components/IngredientStatusBadge'
import type { Ingredient } from '@/features/ingredients/types/ingredient.types'
import { cn } from '@/utils/cn'

export interface IngredientCardProps {
  ingredient: Ingredient
  onSelect: (ingredient: Ingredient) => void
  className?: string
}

export function IngredientCard({ ingredient, onSelect, className }: IngredientCardProps) {
  return (
    <button
      type="button"
      onClick={() => {
        onSelect(ingredient)
      }}
      className={cn('w-full text-left', className)}
    >
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="mb-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <IngredientStatusBadge status={ingredient.status} />
            <IngredientCategoryBadge category={ingredient.category} />
          </div>
          <CardTitle className="text-base">{ingredient.name}</CardTitle>
          <CardDescription>{ingredient.ingredientCode}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>
            Estoque: <span className="font-medium text-foreground">{ingredient.currentStock} {ingredient.unit}</span>
          </p>
          <p>Fornecedor: {ingredient.supplier}</p>
          <p>Local: {ingredient.location}</p>
        </CardContent>
      </Card>
    </button>
  )
}
