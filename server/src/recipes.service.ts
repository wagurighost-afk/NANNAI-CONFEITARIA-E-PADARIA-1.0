import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { config } from './config.js'
import {
  deleteRecipeRecord,
  loadAllRecipes,
  loadRecipeRecord,
  saveRecipeRecord,
} from './db/index.js'
import { emitRealtime } from './events.js'
import type {
  Recipe,
  RecipeAttachment,
  RecipeAttachmentKind,
  RecipeFilters,
  RecipeIngredient,
} from './types.js'

export interface RecipeInput {
  name: string
  category: Recipe['category']
  ingredients: RecipeIngredient[]
  preparationMethod: string
  notes: string
  prepTimeMinutes: number
  yield: string
  photoUrl?: string
  status: Recipe['status']
}

function getNextRecipeCode(recipes: Recipe[]): string {
  const max = recipes.reduce((acc, recipe) => {
    const match = recipe.recipeCode.match(/REC-(\d+)/)
    if (!match?.[1]) {
      return acc
    }
    return Math.max(acc, Number.parseInt(match[1], 10))
  }, 0)

  return `REC-${String(max + 1).padStart(6, '0')}`
}

function resolveAttachmentKind(fileName: string): RecipeAttachmentKind {
  const extension = path.extname(fileName).toLowerCase()
  if (extension === '.pdf') {
    return 'pdf'
  }
  if (extension === '.xls' || extension === '.xlsx') {
    return 'excel'
  }
  return 'word'
}

function removeAttachmentFiles(attachments: RecipeAttachment[]): void {
  for (const attachment of attachments) {
    const fileName = path.basename(attachment.fileUrl)
    const filePath = path.join(config.uploadsDir, fileName)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }
}

function matchesFilters(recipe: Recipe, filters: RecipeFilters): boolean {
  const search = (filters.search ?? '').trim().toLowerCase()
  if (search && !`${recipe.name} ${recipe.recipeCode}`.toLowerCase().includes(search)) {
    return false
  }
  if (filters.category && filters.category !== 'all' && recipe.category !== filters.category) {
    return false
  }
  if (filters.status && filters.status !== 'all' && recipe.status !== filters.status) {
    return false
  }
  return true
}

function normalizeInput(input: RecipeInput): RecipeInput {
  return {
    name: input.name.trim(),
    category: input.category,
    ingredients: input.ingredients.map((item) => ({
      name: item.name.trim(),
      quantity: item.quantity,
      unit: item.unit.trim(),
      ...(item.ingredientId ? { ingredientId: item.ingredientId } : {}),
    })),
    preparationMethod: input.preparationMethod.trim(),
    notes: input.notes.trim(),
    prepTimeMinutes: input.prepTimeMinutes,
    yield: input.yield.trim(),
    ...(input.photoUrl?.trim() ? { photoUrl: input.photoUrl.trim() } : {}),
    status: input.status,
  }
}

function toRecipe(
  input: RecipeInput,
  id: string,
  recipeCode: string,
  timestamps: { createdAt: string; updatedAt: string },
  attachments: RecipeAttachment[] = [],
): Recipe {
  return {
    id,
    recipeCode,
    name: input.name,
    category: input.category,
    ingredients: input.ingredients,
    preparationMethod: input.preparationMethod,
    notes: input.notes,
    prepTimeMinutes: input.prepTimeMinutes,
    yield: input.yield,
    ...(input.photoUrl ? { photoUrl: input.photoUrl } : {}),
    attachments,
    status: input.status,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}

export function buildAttachmentFromUpload(file: Express.Multer.File): RecipeAttachment {
  return {
    id: `att-${randomUUID()}`,
    fileName: file.originalname,
    mimeType: file.mimetype || 'application/octet-stream',
    sizeBytes: file.size,
    kind: resolveAttachmentKind(file.originalname),
    fileUrl: `/api/uploads/${path.basename(file.path)}`,
    uploadedAt: new Date().toISOString(),
  }
}

export async function listRecipes(filters: RecipeFilters = {}): Promise<Recipe[]> {
  const recipes = await loadAllRecipes()
  return recipes
    .filter((recipe) => matchesFilters(recipe, filters))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  return loadRecipeRecord(id)
}

export async function createRecipe(input: RecipeInput, file?: Express.Multer.File): Promise<Recipe> {
  const normalized = normalizeInput(input)
  const recipes = await loadAllRecipes()
  const now = new Date().toISOString()
  const attachments = file ? [buildAttachmentFromUpload(file)] : []

  const recipe = toRecipe(
    normalized,
    `rec-${randomUUID()}`,
    getNextRecipeCode(recipes),
    { createdAt: now, updatedAt: now },
    attachments,
  )

  await saveRecipeRecord(recipe)
  emitRealtime({ scope: 'recipes', action: 'created', recipeId: recipe.id })
  return recipe
}

export async function updateRecipe(
  id: string,
  input: RecipeInput,
  options: { file?: Express.Multer.File; removeAttachment?: boolean } = {},
): Promise<Recipe> {
  const existing = await loadRecipeRecord(id)
  if (!existing) {
    throw new Error('Receita não encontrada.')
  }

  const normalized = normalizeInput(input)
  let attachments = existing.attachments

  if (options.removeAttachment) {
    removeAttachmentFiles(attachments)
    attachments = []
  }

  if (options.file) {
    removeAttachmentFiles(attachments)
    attachments = [buildAttachmentFromUpload(options.file)]
  }

  const recipe = toRecipe(
    normalized,
    id,
    existing.recipeCode,
    { createdAt: existing.createdAt, updatedAt: new Date().toISOString() },
    attachments,
  )

  await saveRecipeRecord(recipe)
  emitRealtime({ scope: 'recipes', action: 'updated', recipeId: recipe.id })
  return recipe
}

export async function removeRecipe(id: string): Promise<void> {
  const existing = await loadRecipeRecord(id)
  if (!existing) {
    throw new Error('Receita não encontrada.')
  }

  removeAttachmentFiles(existing.attachments)
  await deleteRecipeRecord(id)
  emitRealtime({ scope: 'recipes', action: 'deleted', recipeId: id })
}

export async function archiveRecipe(id: string): Promise<Recipe> {
  const existing = await loadRecipeRecord(id)
  if (!existing) {
    throw new Error('Receita não encontrada.')
  }

  const recipe: Recipe = {
    ...existing,
    status: 'Arquivada',
    updatedAt: new Date().toISOString(),
  }

  await saveRecipeRecord(recipe)
  emitRealtime({ scope: 'recipes', action: 'archived', recipeId: recipe.id })
  return recipe
}
