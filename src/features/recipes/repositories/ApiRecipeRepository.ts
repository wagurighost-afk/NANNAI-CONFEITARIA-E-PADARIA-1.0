import { apiClient } from '@/core/api/apiClient'
import type { RecipeRepository } from '@/features/recipes/repositories/RecipeRepository'
import type {
  CreateRecipeInput,
  Recipe,
  RecipeAttachment,
  RecipeFilters,
  UpdateRecipeInput,
} from '@/features/recipes/types/recipe.types'

function mapAttachment(attachment: RecipeAttachment): RecipeAttachment {
  return {
    ...attachment,
    fileUrl: attachment.fileUrl.startsWith('http')
      ? attachment.fileUrl
      : `${window.location.origin}${attachment.fileUrl}`,
  }
}

function mapRecipe(recipe: Recipe): Recipe {
  return {
    ...recipe,
    attachments: (recipe.attachments ?? []).map(mapAttachment),
  }
}

export class ApiRecipeRepository implements RecipeRepository {
  async list(filters?: RecipeFilters): Promise<Recipe[]> {
    const { data } = await apiClient.get<Recipe[]>('/recipes', { params: filters })
    return data.map(mapRecipe)
  }

  async getById(id: string): Promise<Recipe | null> {
    try {
      const { data } = await apiClient.get<Recipe>(`/recipes/${id}`)
      return mapRecipe(data)
    } catch {
      return null
    }
  }

  async create(input: CreateRecipeInput, attachment?: File): Promise<Recipe> {
    const formData = new FormData()
    formData.append('data', JSON.stringify(input))
    if (attachment) {
      formData.append('attachment', attachment)
    }

    const { data } = await apiClient.post<Recipe>('/recipes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return mapRecipe(data)
  }

  async update(
    id: string,
    input: UpdateRecipeInput,
    attachment?: File,
    removeAttachment = false,
  ): Promise<Recipe> {
    const formData = new FormData()
    formData.append('data', JSON.stringify(input))
    formData.append('removeAttachment', String(removeAttachment))
    if (attachment) {
      formData.append('attachment', attachment)
    }

    const { data } = await apiClient.put<Recipe>(`/recipes/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return mapRecipe(data)
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/recipes/${id}`)
  }

  async archive(id: string): Promise<Recipe> {
    const { data } = await apiClient.patch<Recipe>(`/recipes/${id}/archive`)
    return mapRecipe(data)
  }

  async addAttachment(recipeId: string, attachment: RecipeAttachment): Promise<Recipe> {
    void attachment
    const existing = await this.getById(recipeId)
    if (!existing) {
      throw new Error('Receita não encontrada.')
    }
    return existing
  }
}
