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
  Recipe,
  RecipeAttachment,
  RecipeFilters,
  UpdateRecipeInput,
} from '@/features/recipes/types/recipe.types'
import { buildRecipeAttachmentFromFile } from '@/features/recipes/utils/buildRecipeAttachment'
import { getNextRecipeCode } from '@/features/recipes/utils/recipeCode'

function delay(ms = 240): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

let store: Recipe[] = RECIPES_MOCK.map((recipe) => ({
  ...recipe,
  attachments: recipe.attachments ?? [],
}))

let storeReady: Promise<void> = loadPersistedRecipes()
  .then((recipes) => {
    store = recipes
  })
  .catch(() => {
    store = RECIPES_MOCK.map((recipe) => ({
      ...recipe,
      attachments: recipe.attachments ?? [],
    }))
  })

async function ensureStore(): Promise<void> {
  await storeReady
}

function saveStore(): void {
  persistRecipes(store)
}

function matches(recipe: Recipe, filters: RecipeFilters): boolean {
  const search = filters.search.trim().toLowerCase()
  if (search && !`${recipe.name} ${recipe.recipeCode}`.toLowerCase().includes(search)) {
    return false
  }
  if (filters.category !== 'all' && recipe.category !== filters.category) {
    return false
  }
  if (filters.status !== 'all' && recipe.status !== filters.status) {
    return false
  }
  return true
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
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}

export class MockRecipeRepository implements RecipeRepository {
  async list(filters?: RecipeFilters): Promise<Recipe[]> {
    await ensureStore()
    await delay()
    const active = filters ?? { search: '', category: 'all', status: 'all' }
    return store.filter((recipe) => matches(recipe, active))
  }

  async getById(id: string): Promise<Recipe | null> {
    await ensureStore()
    await delay()
    return store.find((recipe) => recipe.id === id) ?? null
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
    }, attachments)
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

export class ApiRecipeRepository implements RecipeRepository {
  async list(): Promise<never> {
    throw new Error('ApiRecipeRepository não implementado.')
  }
  async getById(): Promise<never> {
    throw new Error('ApiRecipeRepository não implementado.')
  }
  async create(): Promise<never> {
    throw new Error('ApiRecipeRepository não implementado.')
  }
  async update(): Promise<never> {
    throw new Error('ApiRecipeRepository não implementado.')
  }
  async remove(): Promise<never> {
    throw new Error('ApiRecipeRepository não implementado.')
  }
  async archive(): Promise<never> {
    throw new Error('ApiRecipeRepository não implementado.')
  }
  async addAttachment(): Promise<never> {
    throw new Error('ApiRecipeRepository não implementado.')
  }
}
