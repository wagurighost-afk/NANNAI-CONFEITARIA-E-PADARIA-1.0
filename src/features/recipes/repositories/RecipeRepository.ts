import type {
  CreateRecipeInput,
  Recipe,
  RecipeAttachment,
  RecipeFilters,
  UpdateRecipeInput,
} from '@/features/recipes/types/recipe.types'

export interface RecipeRepository {
  list(filters?: RecipeFilters): Promise<Recipe[]>
  getById(id: string): Promise<Recipe | null>
  create(input: CreateRecipeInput, attachment?: File): Promise<Recipe>
  update(id: string, input: UpdateRecipeInput, attachment?: File, removeAttachment?: boolean): Promise<Recipe>
  remove(id: string): Promise<void>
  archive(id: string): Promise<Recipe>
  addAttachment(recipeId: string, attachment: RecipeAttachment): Promise<Recipe>
}
