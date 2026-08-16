import { Router } from 'express'
import multer from 'multer'
import { toAuditActor } from '../audit/actor.js'
import { config } from '../config.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAdmin, requireAuth } from '../middleware.js'
import {
  createMonthlySchedule,
  getMonthlyScheduleById,
  getMonthlyScheduleByYearMonth,
  importMonthlySchedule,
  listMonthlySchedules,
  swapMonthlyDays,
  toggleMonthlyDay,
  updateMonthlyDay,
} from '../monthlySchedule.service.js'
import type { CreateMonthlyScheduleInput, ImportMonthlyScheduleInput, SwapMonthlyDaysInput, UpdateMonthlyDayInput } from '../types.js'

const upload = multer({
  dest: config.uploadsDir,
  limits: { fileSize: 500 * 1024 * 1024, files: 1 },
})

export const monthlyScheduleRouter = Router()

monthlyScheduleRouter.use(requireAuth)

monthlyScheduleRouter.get('/', async (_req, res) => {
  res.json(await listMonthlySchedules())
})

monthlyScheduleRouter.get('/by-date', async (req, res) => {
  const year = Number(req.query.year)
  const month = Number(req.query.month)
  const schedule = await getMonthlyScheduleByYearMonth(year, month)
  if (!schedule) {
    res.status(404).json({ message: 'Escala não encontrada para este mês.' })
    return
  }
  res.json(schedule)
})

monthlyScheduleRouter.post('/create', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const input = req.body as CreateMonthlyScheduleInput
    const schedule = await createMonthlySchedule(input, toAuditActor(req.user!))
    res.status(201).json(schedule)
  } catch (error) {
    if (error instanceof Error && error.name === 'MonthlyScheduleConflictError') {
      res.status(409).json({ message: error.message })
      return
    }

    if (error instanceof Error && error.name === 'MonthlyScheduleSourceNotFoundError') {
      res.status(404).json({ message: error.message })
      return
    }

    res.status(400).json({
      message: error instanceof Error ? error.message : 'Não foi possível criar a escala.',
    })
  }
})
monthlyScheduleRouter.get('/:id', async (req, res) => {
  const schedule = await getMonthlyScheduleById(req.params.id)
  if (!schedule) {
    res.status(404).json({ message: 'Escala mensal não encontrada.' })
    return
  }
  res.json(schedule)
})

monthlyScheduleRouter.post('/import', requireAdmin, upload.single('file'), async (req: AuthedRequest, res) => {
  try {
    const input = JSON.parse(String(req.body.data ?? '{}')) as ImportMonthlyScheduleInput
    const schedule = await importMonthlySchedule(input, req.file, toAuditActor(req.user!))
    res.status(201).json(schedule)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Dados inválidos.' })
  }
})

monthlyScheduleRouter.patch('/:id/day', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const input = req.body as UpdateMonthlyDayInput
    const schedule = await updateMonthlyDay({
      scheduleId: req.params.id,
      rowId: input.rowId,
      day: input.day,
      status: input.status,
    }, toAuditActor(req.user!))
    res.json(schedule)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Erro ao atualizar dia.' })
  }
})

monthlyScheduleRouter.patch('/:id/swap', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const input = req.body as SwapMonthlyDaysInput
    const schedule = await swapMonthlyDays({
      scheduleId: req.params.id,
      sourceRowId: input.sourceRowId,
      sourceDay: input.sourceDay,
      targetRowId: input.targetRowId,
      targetDay: input.targetDay,
    }, toAuditActor(req.user!))
    res.json(schedule)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Erro ao trocar dias.' })
  }
})

monthlyScheduleRouter.patch('/:id/toggle', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const schedule = await toggleMonthlyDay(
      req.params.id,
      String(req.body.rowId),
      Number(req.body.day),
      toAuditActor(req.user!),
    )
    res.json(schedule)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Erro ao alternar dia.' })
  }
})
