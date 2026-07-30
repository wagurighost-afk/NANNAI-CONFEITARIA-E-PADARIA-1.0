import type {
  CreateIngredientInput,
  Ingredient,
  IngredientFilters,
  UpdateIngredientInput,
} from '@/features/ingredients/types/ingredient.types'
import type { IngredientRepository } from '@/features/ingredients/repositories/IngredientRepository'

/**
 * Future API-backed repository.
 * Kept as a stub so the service can swap implementations without refactor.
 */
export class ApiIngredientRepository implements IngredientRepository {
  async list(_filters?: IngredientFilters): Promise<Ingredient[]> {
    throw new Error('ApiIngredientRepository ainda não implementado.')
  }

  async getById(_id: string): Promise<Ingredient> {
    throw new Error('ApiIngredientRepository ainda não implementado.')
  }

  async create(_input: CreateIngredientInput): Promise<Ingredient> {
    throw new Error('ApiIngredientRepository ainda não implementado.')
  }

  async update(_id: string, _input: UpdateIngredientInput): Promise<Ingredient> {
    throw new Error('ApiIngredientRepository ainda não implementado.')
  }

  async remove(_id: string): Promise<void> {
    throw new Error('ApiIngredientRepository ainda não implementado.')
  }
}
