import { Router } from 'express'
import { toAuditActor } from '../audit/actor.js'
import {
  createLabelFromProduction,
  createLabelRecordFromInput,
  getLabelById,
  isLabelTemplateId,
  listLabelTemplates,
  listLabels,
  reprintLabel,
} from '../labels.service.js'
import { requireAuth } from '../middleware.js'
import type { AuthedRequest } from '../middleware.js'
import type { CreateLabelFromProductionInput, CreateLabelInput, LabelListQuery } from '../types.js'

export const labelsRouter = Router()

labelsRouter.use(requireAuth)

labelsRouter.get('/templates', (_req, res) => {
  res.json({ templates: listLabelTemplates() })
})

labelsRouter.get('/', async (req, res) => {
  const query: LabelListQuery = {
    ...(typeof req.query.search === 'string' ? { search: req.query.search } : {}),
    ...(typeof req.query.productionId === 'string' ? { productionId: req.query.productionId } : {}),
    ...(typeof req.query.from === 'string' ? { from: req.query.from } : {}),
    ...(typeof req.query.to === 'string' ? { to: req.query.to } : {}),
    ...(req.query.limit ? { limit: Number(req.query.limit) } : {}),
    ...(req.query.offset ? { offset: Number(req.query.offset) } : {}),
  }

  if (typeof req.query.templateId === 'string' && isLabelTemplateId(req.query.templateId)) {
    query.templateId = req.query.templateId
  }

  res.json(await listLabels(query))
})

labelsRouter.get('/:id', async (req, res) => {
  const label = await getLabelById(req.params.id)
  if (!label) {
    res.status(404).json({ message: 'Etiqueta não encontrada.' })
    return
  }
  res.json(label)
})

labelsRouter.post('/', async (req: AuthedRequest, res) => {
  try {
    if (!isLabelTemplateId(req.body.templateId)) {
      res.status(400).json({ message: 'Modelo de etiqueta inválido.' })
      return
    }

    const input: CreateLabelInput = {
      templateId: req.body.templateId,
      data: req.body.data ?? {},
      copies: Number(req.body.copies ?? 1),
      ...(typeof req.body.productionId === 'string' ? { productionId: req.body.productionId } : {}),
      ...(typeof req.body.productionItemId === 'string'
        ? { productionItemId: req.body.productionItemId }
        : {}),
      ...(typeof req.body.recipeId === 'string' ? { recipeId: req.body.recipeId } : {}),
    }

    const label = await createLabelRecordFromInput(input, toAuditActor(req.user!))
    res.status(201).json(label)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Dados inválidos.' })
  }
})

labelsRouter.post('/from-production', async (req: AuthedRequest, res) => {
  try {
    const input: CreateLabelFromProductionInput = {
      productionId: String(req.body.productionId ?? ''),
      itemId: String(req.body.itemId ?? ''),
      copies: Number(req.body.copies ?? 1),
      ...(typeof req.body.weight === 'string' ? { weight: req.body.weight } : {}),
      ...(isLabelTemplateId(req.body.templateId) ? { templateId: req.body.templateId } : {}),
    }

    if (!input.productionId || !input.itemId) {
      res.status(400).json({ message: 'Produção e item são obrigatórios.' })
      return
    }

    const label = await createLabelFromProduction(input, toAuditActor(req.user!))
    res.status(201).json(label)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Dados inválidos.' })
  }
})

labelsRouter.post('/:id/reprint', async (req: AuthedRequest, res) => {
  try {
    const copies = Number(req.body.copies ?? 1)
    const label = await reprintLabel(req.params.id, copies, toAuditActor(req.user!))
    res.status(201).json(label)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível reimprimir.'
    const status = message.includes('não encontrada') ? 404 : 400
    res.status(status).json({ message })
  }
})
