import { Router } from 'express'
import { toAuditActor } from '../audit/actor.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth } from '../middleware.js'
import {
  assignWasteResponsible,
  conferenceWasteDay,
  createEmptyWasteDay,
  getWasteControlDay,
  getWasteControlMonthlySummary,
  listWasteProducts,
  saveWasteControlDayRecord,
} from '../wasteControl.service.js'
import type {
  AssignWasteResponsibleInput,
  ConferenceWasteDayInput,
  SaveWasteControlDayInput,
  WasteBuffetType,
  WasteConferenceStatus,
} from '../types.js'

export const wasteControlRouter = Router()

wasteControlRouter.use(requireAuth)

function parseBuffet(value: unknown): WasteBuffetType | null {
  return value === 'cafe' || value === 'cha' || value === 'jantar' ? value : null
}

function parseConferenceStatus(value: unknown): WasteConferenceStatus | null {
  return value === 'aguardando_conferencia' ||
    value === 'conferido' ||
    value === 'necessita_revisao'
    ? value
    : null
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

wasteControlRouter.put('/days/:date', async (req: AuthedRequest, res) => {
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
      ...(req.body.finalize === true ? { finalize: true } : {}),
    }
    const day = await saveWasteControlDayRecord(input, toAuditActor(req.user!))
    res.json(day)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Dados inválidos.' })
  }
})

wasteControlRouter.patch('/days/:date/responsible', async (req: AuthedRequest, res) => {
  const buffet = parseBuffet(req.query.buffet ?? req.body.buffet)
  if (!buffet) {
    res.status(400).json({ message: 'Informe o buffet (cafe, cha ou jantar).' })
    return
  }

  try {
    const input: AssignWasteResponsibleInput = {
      date: req.params.date,
      buffet,
      responsibleEmployeeId: String(req.body.responsibleEmployeeId ?? ''),
      responsibleEmployeeName: String(req.body.responsibleEmployeeName ?? ''),
      responsiblePosition: String(req.body.responsiblePosition ?? ''),
      responsibleShift: String(req.body.responsibleShift ?? ''),
      sector: String(req.body.sector ?? buffet),
    }
    if (!input.responsibleEmployeeId || !input.responsibleEmployeeName) {
      res.status(400).json({ message: 'Informe o responsável da contagem.' })
      return
    }
    const day = await assignWasteResponsible(input, toAuditActor(req.user!))
    res.json(day)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Falha ao atribuir.' })
  }
})

wasteControlRouter.patch('/days/:date/conference', async (req: AuthedRequest, res) => {
  const buffet = parseBuffet(req.query.buffet ?? req.body.buffet)
  const status = parseConferenceStatus(req.body.status)
  if (!buffet || !status) {
    res.status(400).json({ message: 'Informe buffet e status de conferência válidos.' })
    return
  }

  try {
    const input: ConferenceWasteDayInput = {
      date: req.params.date,
      buffet,
      status,
      ...(typeof req.body.notes === 'string' ? { notes: req.body.notes } : {}),
    }
    const day = await conferenceWasteDay(input, req.user!)
    res.json(day)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha na conferência.'
    const statusCode = message.includes('liderança') ? 403 : 400
    res.status(statusCode).json({ message })
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
