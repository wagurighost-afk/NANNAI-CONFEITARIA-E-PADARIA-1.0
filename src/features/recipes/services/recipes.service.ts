import { env } from '@/config/env'
import { ApiRecipeRepository } from '@/features/recipes/repositories/ApiRecipeRepository'
import { MockRecipeRepository } from '@/features/recipes/repositories/MockRecipeRepository'
import type { RecipeRepository } from '@/features/recipes/repositories/RecipeRepository'
import type {
  CreateRecipeInput,
  Recipe,
  RecipeFilters,
  RecipeSavePayload,
  UpdateRecipeInput,
} from '@/features/recipes/types/recipe.types'

const repository: RecipeRepository = env.useMock
  ? new MockRecipeRepository()
  : new ApiRecipeRepository()

export const recipesService = {
  list(filters?: RecipeFilters): Promise<Recipe[]> {
    return repository.list(filters)
  },
  getById(id: string): Promise<Recipe | null> {
    return repository.getById(id)
  },
  create(input: CreateRecipeInput, attachment?: File): Promise<Recipe> {
    return repository.create(input, attachment)
  },
  update(
    id: string,
    input: UpdateRecipeInput,
    attachment?: File,
    removeAttachment?: boolean,
  ): Promise<Recipe> {
    return repository.update(id, input, attachment, removeAttachment)
  },
  remove(id: string): Promise<void> {
    return repository.remove(id)
  },
  archive(id: string): Promise<Recipe> {
    return repository.archive(id)
  },
  saveFromForm(payload: RecipeSavePayload, recipeId?: string): Promise<Recipe> {
    if (recipeId) {
      return repository.update(
        recipeId,
        payload.values,
        payload.attachment ?? undefined,
        payload.removeExistingAttachment ?? false,
      )
    }
    return repository.create(payload.values, payload.attachment ?? undefined)
  },
}
