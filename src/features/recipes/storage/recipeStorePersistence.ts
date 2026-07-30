import { RECIPES_MOCK } from '@/features/recipes/mocks/recipes.mock'
import {
  getOrCreateObjectUrl,
  resolveAttachmentPreviewUrl,
  saveAttachmentBlob,
} from '@/features/recipes/storage/recipeAttachmentBlobStore'
import type { Recipe, RecipeAttachment } from '@/features/recipes/types/recipe.types'
import { storage } from '@/core/storage/storage'

const RECIPE_STORE_KEY = 'nannai_recipes_v1'

function defaultStore(): Recipe[] {
  return RECIPES_MOCK.map((recipe) => ({
    ...recipe,
    attachments: recipe.attachments ?? [],
  }))
}

function serializeRecipes(recipes: Recipe[]): string {
  const payload = recipes.map((recipe) => ({
    ...recipe,
    attachments: recipe.attachments.map((attachment) => ({
      ...attachment,
      fileUrl: '',
    })),
  }))
  return JSON.stringify(payload)
}

async function hydrateAttachment(attachment: RecipeAttachment): Promise<RecipeAttachment> {
  const fileUrl = await resolveAttachmentPreviewUrl(attachment.id, attachment.fileUrl)
  return {
    ...attachment,
    fileUrl: fileUrl ?? '',
  }
}

async function hydrateRecipe(recipe: Recipe): Promise<Recipe> {
  const attachments = await Promise.all(recipe.attachments.map(hydrateAttachment))
  return { ...recipe, attachments }
}

export async function loadPersistedRecipes(): Promise<Recipe[]> {
  const raw = storage.get(RECIPE_STORE_KEY)
  if (!raw) {
    return defaultStore()
  }

  try {
    const parsed = JSON.parse(raw) as Recipe[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultStore()
    }
    return Promise.all(parsed.map(hydrateRecipe))
  } catch {
    return defaultStore()
  }
}

export function persistRecipes(recipes: Recipe[]): void {
  storage.set(RECIPE_STORE_KEY, serializeRecipes(recipes))
}

export async function storeAttachmentFile(attachmentId: string, file: File): Promise<string> {
  await saveAttachmentBlob(attachmentId, file)
  return getOrCreateObjectUrl(attachmentId, file)
}
