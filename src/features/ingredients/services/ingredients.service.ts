import type {
  CreateIngredientInput,
  Ingredient,
  IngredientFilters,
  UpdateIngredientInput,
} from '@/features/ingredients/types/ingredient.types'
import type { IngredientRepository } from '@/features/ingredients/repositories/IngredientRepository'
import { ApiIngredientRepository } from '@/features/ingredients/repositories/ApiIngredientRepository'
import { MockIngredientRepository } from '@/features/ingredients/repositories/MockIngredientRepository'

const USE_MOCK = true

const repository: IngredientRepository = USE_MOCK
  ? new MockIngredientRepository()
  : new ApiIngredientRepository()

/**
 * Application service for ingredients.
 * UI/hooks talk only to this layer.
 */
export const ingredientsService = {
  list(filters?: IngredientFilters): Promise<Ingredient[]> {
    return repository.list(filters)
  },

  getById(id: string): Promise<Ingredient> {
    return repository.getById(id)
  },

  create(input: CreateIngredientInput): Promise<Ingredient> {
    return repository.create(input)
  },

  update(id: string, input: UpdateIngredientInput): Promise<Ingredient> {
    return repository.update(id, input)
  },

  remove(id: string): Promise<void> {
    return repository.remove(id)
  },
}
