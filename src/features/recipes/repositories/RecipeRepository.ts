import type {
  CreateRecipeInput,
  PaginatedRecipes,
  Recipe,
  RecipeAttachment,
  RecipeKpis,
  RecipeListQuery,
  UpdateRecipeInput,
} from '@/features/recipes/types/recipe.types'

export interface RecipeRepository {
  list(query: RecipeListQuery): Promise<PaginatedRecipes>
  getStats(): Promise<RecipeKpis>
  getById(id: string, options?: { recordView?: boolean }): Promise<Recipe | null>
  create(input: CreateRecipeInput, attachment?: File): Promise<Recipe>
  update(id: string, input: UpdateRecipeInput, attachment?: File, removeAttachment?: boolean): Promise<Recipe>
  remove(id: string): Promise<void>
  archive(id: string): Promise<Recipe>
  toggleFavorite(id: string): Promise<Recipe>
  addAttachment(recipeId: string, attachment: RecipeAttachment): Promise<Recipe>
}
