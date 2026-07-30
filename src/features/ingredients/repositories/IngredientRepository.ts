import type {
  CreateIngredientInput,
  Ingredient,
  IngredientFilters,
  UpdateIngredientInput,
} from '@/features/ingredients/types/ingredient.types'

export interface IngredientRepository {
  list(filters?: IngredientFilters): Promise<Ingredient[]>
  getById(id: string): Promise<Ingredient>
  create(input: CreateIngredientInput): Promise<Ingredient>
  update(id: string, input: UpdateIngredientInput): Promise<Ingredient>
  remove(id: string): Promise<void>
}
