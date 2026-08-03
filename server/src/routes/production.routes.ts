import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import multer from 'multer'
import { toAuditActor } from '../audit/actor.js'
import { config } from '../config.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth } from '../middleware.js'
import {
  assertCanEditProduction,
  assertCanManageProductions,
} from '../productionAccess.js'
import {
  addComment,
  appendRecipesToProduction,
  createProduction,
  getProductionById,
  listProductions,
  removeProduction,
  reorderItems,
  resolveCreateProductionInput,
  resolveUpdateProductionInput,
  updateItemStatus,
  updateItemConference,
} from '../production.service.js'
import type { ProductionDay } from '../types.js'

const upload = multer({
  dest: config.uploadsDir,
  limits: { fileSize: 500 * 1024 * 1024, files: 4 },
})

export const productionRouter = Router()

productionRouter.use(requireAuth)

function resolveRouteError(error: unknown): { status: number; message: string } {
  const message = error instanceof Error ? error.message : 'Erro na operação.'
  if (message.includes('permissão')) {
    return { status: 403, message }
  }
  if (message.includes('não encontrada')) {
    return { status: 404, message }
  }
  return { status: 400, message }
}

async function loadProductionOrThrow(id: string): Promise<ProductionDay> {
  const production = await getProductionById(id)
  if (!production) {
    throw new Error('Produção não encontrada.')
  }
  return production
}

productionRouter.get('/', async (req, res) => {
  const productions = await listProductions({
    search: String(req.query.search ?? ''),
    date: String(req.query.date ?? ''),
    shift: String(req.query.shift ?? 'all'),
    sector: String(req.query.sector ?? 'all'),
    employeeId: String(req.query.employeeId ?? 'all'),
    status: String(req.query.status ?? 'all'),
  })
  res.json(productions)
})

productionRouter.get('/:id', async (req, res) => {
  try {
    const production = await loadProductionOrThrow(req.params.id)
    res.json(production)
  } catch (error) {
    const { status, message } = resolveRouteError(error)
    res.status(status).json({ message })
  }
})

productionRouter.post('/', async (req: AuthedRequest, res) => {
  try {
    assertCanManageProductions(req.user!)
    const production = await resolveCreateProductionInput(req.body, toAuditActor(req.user!))
    res.status(201).json(production)
  } catch (error) {
    const { status, message } = resolveRouteError(error)
    res.status(status).json({ message })
  }
})

productionRouter.post('/:id/append-recipes', async (req: AuthedRequest, res) => {
  try {
    const production = await loadProductionOrThrow(req.params.id)
    assertCanEditProduction(req.user!, production)
    const items = Array.isArray(req.body.items) ? req.body.items : []
    const updated = await appendRecipesToProduction(req.params.id, items, toAuditActor(req.user!))
    res.json(updated)
  } catch (error) {
    const { status, message } = resolveRouteError(error)
    res.status(status).json({ message })
  }
})

productionRouter.put('/:id', async (req: AuthedRequest, res) => {
  try {
    const production = await loadProductionOrThrow(req.params.id)
    assertCanEditProduction(req.user!, production)
    const updated = await resolveUpdateProductionInput(req.params.id, req.body, toAuditActor(req.user!))
    res.json(updated)
  } catch (error) {
    const { status, message } = resolveRouteError(error)
    res.status(status).json({ message })
  }
})

productionRouter.delete('/:id', async (req: AuthedRequest, res) => {
  try {
    assertCanManageProductions(req.user!)
    await removeProduction(req.params.id, toAuditActor(req.user!))
    res.status(204).send()
  } catch (error) {
    const { status, message } = resolveRouteError(error)
    res.status(status).json({ message })
  }
})

productionRouter.patch('/:id/items/:itemId/status', async (req: AuthedRequest, res) => {
  try {
    const production = await loadProductionOrThrow(req.params.id)
    assertCanEditProduction(req.user!, production)
    const updated = await updateItemStatus(
      req.params.id,
      req.params.itemId,
      req.body.status,
      toAuditActor(req.user!),
    )
    res.json(updated)
  } catch (error) {
    const { status, message } = resolveRouteError(error)
    res.status(status).json({ message })
  }
})

productionRouter.patch('/:id/items/:itemId/conference', async (req: AuthedRequest, res) => {
  try {
    const production = await loadProductionOrThrow(req.params.id)
    assertCanEditProduction(req.user!, production)
    const updated = await updateItemConference(
      req.params.id,
      req.params.itemId,
      req.body.status,
      toAuditActor(req.user!),
    )
    res.json(updated)
  } catch (error) {
    const { status, message } = resolveRouteError(error)
    res.status(status).json({ message })
  }
})

productionRouter.patch('/:id/items/reorder', async (req: AuthedRequest, res) => {
  try {
    const production = await loadProductionOrThrow(req.params.id)
    assertCanEditProduction(req.user!, production)
    const updated = await reorderItems(req.params.id, req.body.itemIds ?? [], toAuditActor(req.user!))
    res.json(updated)
  } catch (error) {
    const { status, message } = resolveRouteError(error)
    res.status(status).json({ message })
  }
})

productionRouter.post('/:id/duplicate', async (req: AuthedRequest, res) => {
  try {
    assertCanManageProductions(req.user!)
    const source = await loadProductionOrThrow(req.params.id)

    const duplicated = await createProduction({
      ...source,
      id: `prd-${randomUUID()}`,
      productionCode: `${source.productionCode}-COPY`,
      date: String(req.body.targetDate ?? source.date),
      shift: req.body.targetShift ?? source.shift,
      employeeId: req.body.targetEmployeeId ?? source.employeeId,
      items: source.items.map((item) => ({
        ...item,
        status: 'Pendente',
        conference: undefined,
      })),
      comments: [],
      progress: 0,
    }, toAuditActor(req.user!))
    res.status(201).json(duplicated)
  } catch (error) {
    const { status, message } = resolveRouteError(error)
    res.status(status).json({ message })
  }
})

productionRouter.post('/:id/comments', upload.array('photos', 4), async (req: AuthedRequest, res) => {
  try {
    const production = await loadProductionOrThrow(req.params.id)
    assertCanEditProduction(req.user!, production)

    const files = (req.files as Express.Multer.File[] | undefined) ?? []
    const photos = files.map((file) => ({
      id: `cphoto-${randomUUID()}`,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileUrl: `/api/uploads/${path.basename(file.path)}`,
    }))

    const updated = await addComment(req.params.id, {
      authorId: String(req.body.authorId ?? req.user?.employeeId ?? req.user?.id ?? 'unknown'),
      authorName: String(req.body.authorName ?? req.user?.name ?? 'Usuário'),
      message: String(req.body.message ?? ''),
      photos,
    }, toAuditActor(req.user!))
    res.json(updated)
  } catch (error) {
    const { status, message } = resolveRouteError(error)
    res.status(status).json({ message })
  }
})
