export { IngredientsPage } from '@/features/ingredients/pages/IngredientsPage'
export { useIngredients } from '@/features/ingredients/hooks/useIngredients'
export { ingredientsService } from '@/features/ingredients/services/ingredients.service'
export { formatIngredientCode, getNextIngredientCode } from '@/features/ingredients/utils/ingredientCode'
export type {
  Ingredient,
  IngredientFilters,
  IngredientKpis,
  IngredientCategory,
  IngredientUnit,
  IngredientStatus,
} from '@/features/ingredients/types/ingredient.types'
