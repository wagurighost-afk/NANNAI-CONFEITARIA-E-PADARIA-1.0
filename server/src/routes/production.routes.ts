import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import multer from 'multer'
import { config } from '../config.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth } from '../middleware.js'
import {
  addComment,
  createProduction,
  getProductionById,
  listProductions,
  removeProduction,
  reorderItems,
  updateItemStatus,
  updateProduction,
} from '../production.service.js'

const upload = multer({
  dest: config.uploadsDir,
  limits: { fileSize: 500 * 1024 * 1024, files: 4 },
})

export const productionRouter = Router()

productionRouter.use(requireAuth)

productionRouter.get('/', (req, res) => {
  const productions = listProductions({
    search: String(req.query.search ?? ''),
    date: String(req.query.date ?? ''),
    shift: String(req.query.shift ?? 'all'),
    sector: String(req.query.sector ?? 'all'),
    employeeId: String(req.query.employeeId ?? 'all'),
    status: String(req.query.status ?? 'all'),
  })
  res.json(productions)
})

productionRouter.get('/:id', (req, res) => {
  const production = getProductionById(req.params.id)
  if (!production) {
    res.status(404).json({ message: 'Produção não encontrada.' })
    return
  }
  res.json(production)
})

productionRouter.post('/', (req, res) => {
  try {
    const production = createProduction(req.body)
    res.status(201).json(production)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Dados inválidos.' })
  }
})

productionRouter.put('/:id', (req, res) => {
  try {
    const production = updateProduction(req.params.id, req.body)
    res.json(production)
  } catch (error) {
    res.status(404).json({ message: error instanceof Error ? error.message : 'Erro ao atualizar.' })
  }
})

productionRouter.delete('/:id', (req, res) => {
  try {
    removeProduction(req.params.id)
    res.status(204).send()
  } catch (error) {
    res.status(404).json({ message: error instanceof Error ? error.message : 'Erro ao remover.' })
  }
})

productionRouter.patch('/:id/items/:itemId/status', (req, res) => {
  try {
    const production = updateItemStatus(
      req.params.id,
      req.params.itemId,
      req.body.status,
    )
    res.json(production)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Erro ao atualizar item.' })
  }
})

productionRouter.patch('/:id/items/reorder', (req, res) => {
  try {
    const production = reorderItems(req.params.id, req.body.itemIds ?? [])
    res.json(production)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Erro ao reordenar.' })
  }
})

productionRouter.post('/:id/duplicate', (req, res) => {
  try {
    const source = getProductionById(req.params.id)
    if (!source) {
      res.status(404).json({ message: 'Produção de origem não encontrada.' })
      return
    }

    const duplicated = createProduction({
      ...source,
      id: `prd-${randomUUID()}`,
      productionCode: `${source.productionCode}-COPY`,
      date: String(req.body.targetDate ?? source.date),
      shift: req.body.targetShift ?? source.shift,
      employeeId: req.body.targetEmployeeId ?? source.employeeId,
      items: source.items.map((item) => ({ ...item, status: 'Pendente' })),
      comments: [],
      progress: 0,
    })
    res.status(201).json(duplicated)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Erro ao duplicar.' })
  }
})

productionRouter.post('/:id/comments', upload.array('photos', 4), (req: AuthedRequest, res) => {
  try {
    const files = (req.files as Express.Multer.File[] | undefined) ?? []
    const photos = files.map((file) => ({
      id: `cphoto-${randomUUID()}`,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileUrl: `/api/uploads/${path.basename(file.path)}`,
    }))

    const production = addComment(req.params.id, {
      authorId: String(req.body.authorId ?? req.user?.employeeId ?? req.user?.id ?? 'unknown'),
      authorName: String(req.body.authorName ?? req.user?.name ?? 'Usuário'),
      message: String(req.body.message ?? ''),
      photos,
    })
    res.json(production)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Erro ao comentar.' })
  }
})
