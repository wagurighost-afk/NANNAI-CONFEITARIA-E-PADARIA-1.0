import { Router } from 'express'
import { toAuditActor } from '../audit/actor.js'
import { requireAuth } from '../middleware.js'
import type { AuthedRequest } from '../middleware.js'
import {
  getBreadControlDay,
  getBreadControlMonthlySummary,
  getBreadSections,
  listBreadProducts,
  saveBreadControlDayRecord,
} from '../breadControl.service.js'
import type { SaveBreadControlDayInput } from '../types.js'

export const breadControlRouter = Router()

breadControlRouter.use(requireAuth)

breadControlRouter.get('/products', (_req, res) => {
  res.json({
    products: listBreadProducts(),
    sections: getBreadSections(),
  })
})

breadControlRouter.get('/days/:date', async (req, res) => {
  const day = await getBreadControlDay(req.params.date)
  if (!day) {
    res.status(404).json({ message: 'Registro do dia não encontrado.' })
    return
  }
  res.json(day)
})

breadControlRouter.put('/days/:date', async (req: AuthedRequest, res) => {
  try {
    const input: SaveBreadControlDayInput = {
      date: req.params.date,
      pax: Number(req.body.pax ?? 0),
      items: Array.isArray(req.body.items) ? req.body.items : [],
    }
    const day = await saveBreadControlDayRecord(input, toAuditActor(req.user!))
    res.json(day)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Dados inválidos.' })
  }
})

breadControlRouter.get('/summary', async (req, res) => {
  const year = Number(req.query.year)
  const month = Number(req.query.month)
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    res.status(400).json({ message: 'Ano e mês são obrigatórios.' })
    return
  }
  res.json(await getBreadControlMonthlySummary(year, month))
})
