import { Router } from 'express'
import { toAuditActor } from '../audit/actor.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth } from '../middleware.js'
import { isWasteControlUniqueConflict } from '../db/wasteControlConflict.js'
import {
  assignWasteResponsible,
  conferenceWasteDay,
  createEmptyWasteDay,
  getWasteControlDay,
  getWasteControlMonthlySummary,
  getWasteControlOverview,
  listWasteProducts,
  reopenWasteControlDay,
  saveWasteControlDayRecord,
} from '../wasteControl.service.js'
import { isOperationalIsoDate, parseWasteControlSector } from '../wasteControl/sectors.js'
import type {
  AssignWasteResponsibleInput,
  ConferenceWasteDayInput,
  ReopenWasteDayInput,
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

function parseDateParam(value: string): string | null {
  return isOperationalIsoDate(value) ? value : null
}

function conflictStatus(error: unknown): { status: number; message: string } | null {
  if (isWasteControlUniqueConflict(error)) {
    return { status: 409, message: error.message }
  }
  return null
}

wasteControlRouter.get('/products', async (req, res) => {
  const sector = parseWasteControlSector(req.query.sector)
  if (!sector) {
    res.status(400).json({ message: 'Informe o setor (CONFEITARIA ou PADARIA).' })
    return
  }
  const buffet = parseBuffet(req.query.buffet)
  res.json({ products: await listWasteProducts(sector, buffet ?? undefined) })
})

wasteControlRouter.get('/overview/:date', async (req, res) => {
  const date = parseDateParam(req.params.date)
  if (!date) {
    res.status(400).json({ message: 'Data operacional inválida (YYYY-MM-DD).' })
    return
  }
  res.json(await getWasteControlOverview(date))
})

wasteControlRouter.get('/days/:date', async (req, res) => {
  const date = parseDateParam(req.params.date)
  const sector = parseWasteControlSector(req.query.sector ?? req.query.setor)
  const buffet = parseBuffet(req.query.buffet) ?? 'cafe'
  if (!date) {
    res.status(400).json({ message: 'Data operacional inválida (YYYY-MM-DD).' })
    return
  }
  if (!sector) {
    res.status(400).json({ message: 'Informe o setor (CONFEITARIA ou PADARIA).' })
    return
  }

  const day = await getWasteControlDay(date, sector, buffet)
  res.json(day ?? createEmptyWasteDay(date, sector, buffet))
})

wasteControlRouter.put('/days/:date', async (req: AuthedRequest, res) => {
  const date = parseDateParam(req.params.date)
  const sector = parseWasteControlSector(req.query.sector ?? req.body.sector)
  const buffet = parseBuffet(req.query.buffet ?? req.body.buffet)
  if (!date) {
    res.status(400).json({ message: 'Data operacional inválida (YYYY-MM-DD).' })
    return
  }
  if (!sector || !buffet) {
    res.status(400).json({ message: 'Informe setor (CONFEITARIA ou PADARIA) e buffet (cafe, cha ou jantar).' })
    return
  }

  try {
    const input: SaveWasteControlDayInput = {
      date,
      sector,
      buffet,
      pax: Number(req.body.pax ?? 0),
      monthlyGoalReais: Number(req.body.monthlyGoalReais ?? req.body.monthlyGoalKg ?? 0),
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
    const conflict = conflictStatus(error)
    if (conflict) {
      res.status(conflict.status).json({ message: conflict.message })
      return
    }
    res.status(400).json({ message: error instanceof Error ? error.message : 'Dados inválidos.' })
  }
})

wasteControlRouter.patch('/days/:date/responsible', async (req: AuthedRequest, res) => {
  const date = parseDateParam(req.params.date)
  const sector = parseWasteControlSector(req.query.sector ?? req.body.sector)
  const buffet = parseBuffet(req.query.buffet ?? req.body.buffet) ?? 'cafe'
  if (!date || !sector) {
    res.status(400).json({ message: 'Informe data operacional e setor (CONFEITARIA ou PADARIA).' })
    return
  }

  try {
    const input: AssignWasteResponsibleInput = {
      date,
      sector,
      buffet,
      responsibleEmployeeId: String(req.body.responsibleEmployeeId ?? ''),
      responsibleEmployeeName: String(req.body.responsibleEmployeeName ?? ''),
      responsiblePosition: String(req.body.responsiblePosition ?? ''),
      responsibleShift: String(req.body.responsibleShift ?? ''),
    }
    if (!input.responsibleEmployeeId || !input.responsibleEmployeeName) {
      res.status(400).json({ message: 'Informe o responsável da contagem.' })
      return
    }
    const day = await assignWasteResponsible(input, toAuditActor(req.user!))
    res.json(day)
  } catch (error) {
    const conflict = conflictStatus(error)
    if (conflict) {
      res.status(conflict.status).json({ message: conflict.message })
      return
    }
    res.status(400).json({ message: error instanceof Error ? error.message : 'Falha ao atribuir.' })
  }
})

wasteControlRouter.patch('/days/:date/conference', async (req: AuthedRequest, res) => {
  const date = parseDateParam(req.params.date)
  const sector = parseWasteControlSector(req.query.sector ?? req.body.sector)
  const status = parseConferenceStatus(req.body.status)
  const buffet = parseBuffet(req.query.buffet ?? req.body.buffet) ?? 'cafe'
  if (!date || !sector || !status) {
    res.status(400).json({ message: 'Informe data, setor e status de conferência válidos.' })
    return
  }

  try {
    const input: ConferenceWasteDayInput = {
      date,
      sector,
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

wasteControlRouter.patch('/days/:date/reopen', async (req: AuthedRequest, res) => {
  const date = parseDateParam(req.params.date)
  const sector = parseWasteControlSector(req.query.sector ?? req.body.sector)
  if (!date || !sector) {
    res.status(400).json({ message: 'Informe data operacional e setor (CONFEITARIA ou PADARIA).' })
    return
  }

  try {
    const input: ReopenWasteDayInput = {
      date,
      sector,
      reason: String(req.body.reason ?? ''),
    }
    const day = await reopenWasteControlDay(input, req.user!)
    res.json(day)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao reabrir.'
    const statusCode = message.includes('Chef/Admin') || message.includes('liderança') ? 403 : 400
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
