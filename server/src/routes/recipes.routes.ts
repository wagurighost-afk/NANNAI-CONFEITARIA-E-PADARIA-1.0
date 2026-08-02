import { Router } from 'express'
import multer from 'multer'
import { toAuditActor } from '../audit/actor.js'
import { config } from '../config.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth, requireManager } from '../middleware.js'
import {
  archiveRecipe,
  createRecipe,
  duplicateRecipe,
  getRecipeById,
  getRecipesStats,
  listRecipesPage,
  removeRecipe,
  toggleRecipeFavorite,
  updateRecipe,
} from '../recipes.service.js'
import type { RecipeInput } from '../recipes.service.js'
import type { RecipeListQuery, RecipeQuickFilter, RecipeSortBy } from '../types.js'

const upload = multer({
  dest: config.uploadsDir,
  limits: { fileSize: 500 * 1024 * 1024, files: 1 },
})

export const recipesRouter = Router()

recipesRouter.use(requireAuth)

function parseRecipeInput(body: Record<string, unknown>): RecipeInput {
  const raw = typeof body.data === 'string' ? JSON.parse(body.data) : body
  return raw as RecipeInput
}

function parseListQuery(req: AuthedRequest): RecipeListQuery {
  const sortBy = String(req.query.sortBy ?? 'date') as RecipeSortBy
  const quickFilter = String(req.query.quickFilter ?? 'all') as RecipeQuickFilter
  const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc'

  return {
    search: String(req.query.search ?? ''),
    category: String(req.query.category ?? 'all'),
    status: String(req.query.status ?? 'all'),
    quickFilter,
    sortBy,
    sortOrder,
    page: Number(req.query.page ?? 1),
    pageSize: Number(req.query.pageSize ?? 24),
  }
}

recipesRouter.get('/stats', async (_req, res) => {
  const stats = await getRecipesStats()
  res.json(stats)
})

recipesRouter.get('/', async (req, res) => {
  const result = await listRecipesPage(parseListQuery(req))
  res.json(result)
})

recipesRouter.get('/:id', async (req, res) => {
  const recordView = req.query.recordView === 'true' || req.query.recordView === '1'
  const recipe = await getRecipeById(req.params.id, { recordView })
  if (!recipe) {
    res.status(404).json({ message: 'Receita não encontrada.' })
    return
  }
  res.json(recipe)
})

recipesRouter.post('/', requireManager, upload.single('attachment'), async (req: AuthedRequest, res) => {
  try {
    const recipe = await createRecipe(parseRecipeInput(req.body), req.file, toAuditActor(req.user!))
    res.status(201).json(recipe)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Dados inválidos.' })
  }
})

recipesRouter.put('/:id', requireManager, upload.single('attachment'), async (req: AuthedRequest, res) => {
  try {
    const recipe = await updateRecipe(req.params.id, parseRecipeInput(req.body), {
      file: req.file,
      removeAttachment: req.body.removeAttachment === 'true' || req.body.removeAttachment === true,
      actor: toAuditActor(req.user!),
    })
    res.json(recipe)
  } catch (error) {
    res.status(404).json({ message: error instanceof Error ? error.message : 'Erro ao atualizar.' })
  }
})

recipesRouter.delete('/:id', requireManager, async (req: AuthedRequest, res) => {
  try {
    await removeRecipe(req.params.id, toAuditActor(req.user!))
    res.status(204).send()
  } catch (error) {
    res.status(404).json({ message: error instanceof Error ? error.message : 'Erro ao remover.' })
  }
})

recipesRouter.patch('/:id/favorite', async (req: AuthedRequest, res) => {
  try {
    const recipe = await toggleRecipeFavorite(req.params.id, toAuditActor(req.user!))
    res.json(recipe)
  } catch (error) {
    res.status(404).json({ message: error instanceof Error ? error.message : 'Erro ao favoritar.' })
  }
})

recipesRouter.patch('/:id/archive', requireManager, async (req: AuthedRequest, res) => {
  try {
    const recipe = await archiveRecipe(req.params.id, toAuditActor(req.user!))
    res.json(recipe)
  } catch (error) {
    res.status(404).json({ message: error instanceof Error ? error.message : 'Erro ao arquivar.' })
  }
})

recipesRouter.post('/:id/duplicate', requireManager, async (req: AuthedRequest, res) => {
  try {
    const recipe = await duplicateRecipe(req.params.id, toAuditActor(req.user!))
    res.status(201).json(recipe)
  } catch (error) {
    res.status(404).json({ message: error instanceof Error ? error.message : 'Erro ao duplicar.' })
  }
})
