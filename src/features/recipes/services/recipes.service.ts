import { env } from '@/config/env'
import { ApiRecipeRepository } from '@/features/recipes/repositories/ApiRecipeRepository'
import { MockRecipeRepository } from '@/features/recipes/repositories/MockRecipeRepository'
import type { RecipeRepository } from '@/features/recipes/repositories/RecipeRepository'
import type {
  CreateRecipeInput,
  Recipe,
  RecipeListQuery,
  RecipeSavePayload,
  UpdateRecipeInput,
} from '@/features/recipes/types/recipe.types'

const repository: RecipeRepository = env.useMock
  ? new MockRecipeRepository()
  : new ApiRecipeRepository()

export const recipesService = {
  list(query: RecipeListQuery) {
    return repository.list(query)
  },
  getStats() {
    return repository.getStats()
  },
  getById(id: string, options?: { recordView?: boolean }) {
    return repository.getById(id, options)
  },
  create(input: CreateRecipeInput, attachment?: File) {
    return repository.create(input, attachment)
  },
  update(
    id: string,
    input: UpdateRecipeInput,
    attachment?: File,
    removeAttachment?: boolean,
  ) {
    return repository.update(id, input, attachment, removeAttachment)
  },
  remove(id: string) {
    return repository.remove(id)
  },
  archive(id: string) {
    return repository.archive(id)
  },
  toggleFavorite(id: string) {
    return repository.toggleFavorite(id)
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
