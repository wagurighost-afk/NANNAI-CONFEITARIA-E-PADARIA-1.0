import { Router } from 'express'
import multer from 'multer'
import { config } from '../config.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth, requireManager } from '../middleware.js'
import {
  getMonthlyScheduleById,
  getMonthlyScheduleByYearMonth,
  importMonthlySchedule,
  listMonthlySchedules,
  swapMonthlyDays,
  toggleMonthlyDay,
  updateMonthlyDay,
} from '../monthlySchedule.service.js'
import type { ImportMonthlyScheduleInput, SwapMonthlyDaysInput, UpdateMonthlyDayInput } from '../types.js'

const upload = multer({
  dest: config.uploadsDir,
  limits: { fileSize: 500 * 1024 * 1024, files: 1 },
})

export const monthlyScheduleRouter = Router()

monthlyScheduleRouter.use(requireAuth)

monthlyScheduleRouter.get('/', (_req, res) => {
  res.json(listMonthlySchedules())
})

monthlyScheduleRouter.get('/by-date', (req, res) => {
  const year = Number(req.query.year)
  const month = Number(req.query.month)
  const schedule = getMonthlyScheduleByYearMonth(year, month)
  if (!schedule) {
    res.status(404).json({ message: 'Escala não encontrada para este mês.' })
    return
  }
  res.json(schedule)
})

monthlyScheduleRouter.get('/:id', (req, res) => {
  const schedule = getMonthlyScheduleById(req.params.id)
  if (!schedule) {
    res.status(404).json({ message: 'Escala mensal não encontrada.' })
    return
  }
  res.json(schedule)
})

monthlyScheduleRouter.post('/import', requireManager, upload.single('file'), (req: AuthedRequest, res) => {
  try {
    const input = JSON.parse(String(req.body.data ?? '{}')) as ImportMonthlyScheduleInput
    const schedule = importMonthlySchedule(input, req.file)
    res.status(201).json(schedule)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Dados inválidos.' })
  }
})

monthlyScheduleRouter.patch('/:id/day', requireManager, (req, res) => {
  try {
    const input = req.body as UpdateMonthlyDayInput
    const schedule = updateMonthlyDay({
      scheduleId: req.params.id,
      rowId: input.rowId,
      day: input.day,
      status: input.status,
    })
    res.json(schedule)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Erro ao atualizar dia.' })
  }
})

monthlyScheduleRouter.patch('/:id/swap', requireManager, (req, res) => {
  try {
    const input = req.body as SwapMonthlyDaysInput
    const schedule = swapMonthlyDays({
      scheduleId: req.params.id,
      sourceRowId: input.sourceRowId,
      sourceDay: input.sourceDay,
      targetRowId: input.targetRowId,
      targetDay: input.targetDay,
    })
    res.json(schedule)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Erro ao trocar dias.' })
  }
})

monthlyScheduleRouter.patch('/:id/toggle', requireManager, (req, res) => {
  try {
    const schedule = toggleMonthlyDay(
      req.params.id,
      String(req.body.rowId),
      Number(req.body.day),
    )
    res.json(schedule)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Erro ao alternar dia.' })
  }
})
