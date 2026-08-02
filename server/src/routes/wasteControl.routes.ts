import { Router } from 'express'
import {
  createEmptyWasteDay,
  getWasteControlDay,
  getWasteControlMonthlySummary,
  listWasteProducts,
  saveWasteControlDayRecord,
} from '../wasteControl.service.js'
import type { SaveWasteControlDayInput, WasteBuffetType } from '../types.js'
import { requireAuth } from '../middleware.js'

export const wasteControlRouter = Router()

wasteControlRouter.use(requireAuth)

function parseBuffet(value: unknown): WasteBuffetType | null {
  return value === 'cafe' || value === 'cha' || value === 'jantar' ? value : null
}

wasteControlRouter.get('/products', (req, res) => {
  const buffet = parseBuffet(req.query.buffet)
  res.json({ products: listWasteProducts(buffet ?? undefined) })
})

wasteControlRouter.get('/days/:date', async (req, res) => {
  const buffet = parseBuffet(req.query.buffet)
  if (!buffet) {
    res.status(400).json({ message: 'Informe o buffet (cafe, cha ou jantar).' })
    return
  }

  const day = await getWasteControlDay(req.params.date, buffet)
  res.json(day ?? createEmptyWasteDay(req.params.date, buffet))
})

wasteControlRouter.put('/days/:date', async (req, res) => {
  const buffet = parseBuffet(req.query.buffet ?? req.body.buffet)
  if (!buffet) {
    res.status(400).json({ message: 'Informe o buffet (cafe, cha ou jantar).' })
    return
  }

  try {
    const input: SaveWasteControlDayInput = {
      date: req.params.date,
      buffet,
      pax: Number(req.body.pax ?? 0),
      monthlyGoalKg: Number(req.body.monthlyGoalKg ?? 0),
      dessertsQty: Number(req.body.dessertsQty ?? 0),
      phases: {
        entrada: Array.isArray(req.body.phases?.entrada) ? req.body.phases.entrada : [],
        reposicao: Array.isArray(req.body.phases?.reposicao) ? req.body.phases.reposicao : [],
        finalizacao: Array.isArray(req.body.phases?.finalizacao) ? req.body.phases.finalizacao : [],
      },
    }
    const day = await saveWasteControlDayRecord(input)
    res.json(day)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Dados inválidos.' })
  }
})

wasteControlRouter.get('/summary', async (req, res) => {
  const year = Number(req.query.year)
  const month = Number(req.query.month)
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    res.status(400).json({ message: 'Ano e mês são obrigatórios.' })
    return
  }
  res.json(await getWasteControlMonthlySummary(year, month))
})
