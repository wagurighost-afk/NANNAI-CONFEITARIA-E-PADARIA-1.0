import { RECIPES_MOCK } from '@/features/recipes/mocks/recipes.mock'
import type { RecipeRepository } from '@/features/recipes/repositories/RecipeRepository'
import {
  deleteAttachmentBlob,
} from '@/features/recipes/storage/recipeAttachmentBlobStore'
import {
  loadPersistedRecipes,
  persistRecipes,
} from '@/features/recipes/storage/recipeStorePersistence'
import type {
  CreateRecipeInput,
  PaginatedRecipes,
  Recipe,
  RecipeAttachment,
  RecipeKpis,
  RecipeListQuery,
  UpdateRecipeInput,
} from '@/features/recipes/types/recipe.types'
import { buildRecipeAttachmentFromFile } from '@/features/recipes/utils/buildRecipeAttachment'
import { computeRecipeStatsFromStore, listRecipesFromStore } from '@/features/recipes/utils/recipeListQuery'
import { getNextRecipeCode } from '@/features/recipes/utils/recipeCode'

function delay(ms = 240): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

let store: Recipe[] = RECIPES_MOCK.map((recipe) => ({
  ...recipe,
  attachments: recipe.attachments ?? [],
  isFavorite: recipe.isFavorite ?? false,
  usageCount: recipe.usageCount ?? 0,
  lastViewedAt: recipe.lastViewedAt ?? null,
  lastUsedAt: recipe.lastUsedAt ?? null,
}))

let storeReady: Promise<void> = loadPersistedRecipes()
  .then((recipes) => {
    store = recipes.map((recipe) => ({
      ...recipe,
      isFavorite: recipe.isFavorite ?? false,
      usageCount: recipe.usageCount ?? 0,
      lastViewedAt: recipe.lastViewedAt ?? null,
      lastUsedAt: recipe.lastUsedAt ?? null,
    }))
  })
  .catch(() => {
    store = RECIPES_MOCK.map((recipe) => ({
      ...recipe,
      attachments: recipe.attachments ?? [],
      isFavorite: false,
      usageCount: 0,
      lastViewedAt: null,
      lastUsedAt: null,
    }))
  })

async function ensureStore(): Promise<void> {
  await storeReady
}

function saveStore(): void {
  persistRecipes(store)
}

async function removeAttachmentFiles(attachments: RecipeAttachment[]): Promise<void> {
  await Promise.all(attachments.map((attachment) => deleteAttachmentBlob(attachment.id)))
}

function toRecipe(
  input: CreateRecipeInput,
  id: string,
  recipeCode: string,
  timestamps: { createdAt: string; updatedAt: string },
  attachments: RecipeAttachment[] = [],
  meta: Pick<Recipe, 'isFavorite' | 'usageCount' | 'lastViewedAt' | 'lastUsedAt'> = {},
): Recipe {
  return {
    id,
    recipeCode,
    name: input.name.trim(),
    category: input.category,
    ingredients: input.ingredients,
    preparationMethod: input.preparationMethod.trim(),
    notes: input.notes.trim(),
    prepTimeMinutes: input.prepTimeMinutes,
    yield: input.yield.trim(),
    ...(input.photoUrl.trim() ? { photoUrl: input.photoUrl.trim() } : {}),
    attachments,
    status: input.status,
    isFavorite: meta.isFavorite ?? false,
    usageCount: meta.usageCount ?? 0,
    lastViewedAt: meta.lastViewedAt ?? null,
    lastUsedAt: meta.lastUsedAt ?? null,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}

export class MockRecipeRepository implements RecipeRepository {
  async list(query: RecipeListQuery): Promise<PaginatedRecipes> {
    await ensureStore()
    await delay()
    return listRecipesFromStore(store, query)
  }

  async getStats(): Promise<RecipeKpis> {
    await ensureStore()
    await delay()
    return computeRecipeStatsFromStore(store)
  }

  async getById(id: string, options?: { recordView?: boolean }): Promise<Recipe | null> {
    await ensureStore()
    await delay()
    const index = store.findIndex((recipe) => recipe.id === id)
    if (index === -1) {
      return null
    }

    if (options?.recordView) {
      const existing = store[index]
      if (!existing) {
        return null
      }
      store[index] = {
        ...existing,
        lastViewedAt: new Date().toISOString(),
      }
      saveStore()
      return store[index]
    }

    return store[index] ?? null
  }

  async create(input: CreateRecipeInput, attachment?: File): Promise<Recipe> {
    await ensureStore()
    await delay()
    const now = new Date().toISOString()
    const attachments = attachment ? [await buildRecipeAttachmentFromFile(attachment)] : []

    const recipe = toRecipe(
      input,
      `rec-${crypto.randomUUID()}`,
      getNextRecipeCode(store.map((r) => r.recipeCode)),
      { createdAt: now, updatedAt: now },
      attachments,
    )
    store = [recipe, ...store]
    saveStore()
    return recipe
  }

  async update(
    id: string,
    input: UpdateRecipeInput,
    attachment?: File,
    removeAttachment = false,
  ): Promise<Recipe> {
    await ensureStore()
    await delay()
    const index = store.findIndex((recipe) => recipe.id === id)
    if (index === -1) {
      throw new Error('Receita não encontrada.')
    }
    const existing = store[index]
    if (!existing) {
      throw new Error('Receita não encontrada.')
    }

    let attachments = existing.attachments
    if (removeAttachment) {
      await removeAttachmentFiles(attachments)
      attachments = []
    }
    if (attachment) {
      await removeAttachmentFiles(attachments)
      attachments = [await buildRecipeAttachmentFromFile(attachment)]
    }

    const now = new Date().toISOString()
    const updated = toRecipe(input, id, existing.recipeCode, {
      createdAt: existing.createdAt,
      updatedAt: now,
    }, attachments, {
      isFavorite: existing.isFavorite ?? false,
      usageCount: existing.usageCount ?? 0,
      lastViewedAt: existing.lastViewedAt ?? null,
      lastUsedAt: existing.lastUsedAt ?? null,
    })
    store[index] = updated
    saveStore()
    return updated
  }

  async remove(id: string): Promise<void> {
    await ensureStore()
    await delay()
    const recipe = store.find((item) => item.id === id)
    if (recipe) {
      await removeAttachmentFiles(recipe.attachments)
    }
    store = store.filter((item) => item.id !== id)
    saveStore()
  }

  async archive(id: string): Promise<Recipe> {
    await ensureStore()
    await delay()
    const index = store.findIndex((recipe) => recipe.id === id)
    if (index === -1) {
      throw new Error('Receita não encontrada.')
    }
    const existing = store[index]
    if (!existing) {
      throw new Error('Receita não encontrada.')
    }
    store[index] = {
      ...existing,
      status: 'Arquivada',
      updatedAt: new Date().toISOString(),
    }
    saveStore()
    return store[index]
  }

  async toggleFavorite(id: string): Promise<Recipe> {
    await ensureStore()
    await delay()
    const index = store.findIndex((recipe) => recipe.id === id)
    if (index === -1) {
      throw new Error('Receita não encontrada.')
    }
    const existing = store[index]
    if (!existing) {
      throw new Error('Receita não encontrada.')
    }
    store[index] = {
      ...existing,
      isFavorite: !existing.isFavorite,
      updatedAt: new Date().toISOString(),
    }
    saveStore()
    return store[index]
  }

  async addAttachment(recipeId: string, attachment: RecipeAttachment): Promise<Recipe> {
    await ensureStore()
    await delay()
    const index = store.findIndex((recipe) => recipe.id === recipeId)
    if (index === -1) {
      throw new Error('Receita não encontrada.')
    }
    const existing = store[index]
    if (!existing) {
      throw new Error('Receita não encontrada.')
    }
    await removeAttachmentFiles(existing.attachments)
    store[index] = {
      ...existing,
      attachments: [attachment],
      updatedAt: new Date().toISOString(),
    }
    saveStore()
    return store[index]
  }
}
