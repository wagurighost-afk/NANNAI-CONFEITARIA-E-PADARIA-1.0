import { Router } from 'express'
import multer from 'multer'
import { toAuditActor } from '../audit/actor.js'
import { config } from '../config.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth, requireManager } from '../middleware.js'
import {
  archiveRecipe,
  createRecipe,
  getRecipeById,
  listRecipes,
  removeRecipe,
  updateRecipe,
} from '../recipes.service.js'
import type { RecipeInput } from '../recipes.service.js'

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

recipesRouter.get('/', async (req, res) => {
  const recipes = await listRecipes({
    search: String(req.query.search ?? ''),
    category: String(req.query.category ?? 'all'),
    status: String(req.query.status ?? 'all'),
  })
  res.json(recipes)
})

recipesRouter.get('/:id', async (req, res) => {
  const recipe = await getRecipeById(req.params.id)
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

recipesRouter.patch('/:id/archive', requireManager, async (req: AuthedRequest, res) => {
  try {
    const recipe = await archiveRecipe(req.params.id, toAuditActor(req.user!))
    res.json(recipe)
  } catch (error) {
    res.status(404).json({ message: error instanceof Error ? error.message : 'Erro ao arquivar.' })
  }
})
