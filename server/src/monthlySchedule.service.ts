import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { config } from './config.js'
import { matchEmployeeIdByScheduleName } from './data/monthlyScheduleSeed.js'
import {
  loadAllMonthlySchedules,
  loadMonthlyScheduleRecord,
  saveMonthlyScheduleRecord,
} from './db.js'
import { emitRealtime } from './events.js'
import type {
  ImportMonthlyScheduleInput,
  MonthlyDayStatus,
  MonthlySchedule,
  MonthlyScheduleAttachment,
  MonthlyScheduleRow,
  SwapMonthlyDaysInput,
  UpdateMonthlyDayInput,
} from './types.js'

const MONTHLY_DAY_STATUS_LABELS: Record<MonthlyDayStatus, string> = {
  work: 'Trabalho',
  off: 'Folga',
  vacation: 'Férias',
  leave: 'Licença',
  other: 'Outro',
}

function scheduleKey(year: number, month: number): string {
  return `ms-${year}-${String(month).padStart(2, '0')}`
}

function nextDayStatus(current: MonthlyDayStatus): MonthlyDayStatus {
  const order: MonthlyDayStatus[] = ['work', 'off', 'vacation', 'leave', 'other']
  const index = order.indexOf(current)
  return order[(index + 1) % order.length] ?? 'work'
}

function resolveAttachmentKind(fileName: string): MonthlyScheduleAttachment['kind'] {
  const extension = path.extname(fileName).toLowerCase()
  if (extension === '.pdf') {
    return 'pdf'
  }
  if (extension === '.xls' || extension === '.xlsx') {
    return 'excel'
  }
  return 'word'
}

function removeAttachmentFile(attachment: MonthlyScheduleAttachment | null): void {
  if (!attachment) {
    return
  }
  const fileName = path.basename(attachment.fileUrl)
  const filePath = path.join(config.uploadsDir, fileName)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

function buildAttachmentFromUpload(file: Express.Multer.File): MonthlyScheduleAttachment {
  return {
    id: `sch-att-${randomUUID()}`,
    fileName: file.originalname,
    mimeType: file.mimetype || 'application/octet-stream',
    sizeBytes: file.size,
    kind: resolveAttachmentKind(file.originalname),
    fileUrl: `/api/uploads/${path.basename(file.path)}`,
    uploadedAt: new Date().toISOString(),
  }
}

function mapImportRows(rows: ImportMonthlyScheduleInput['rows']): MonthlyScheduleRow[] {
  return rows.map((row) => ({
    id: `msr-${randomUUID()}`,
    employeeId: row.employeeId ?? matchEmployeeIdByScheduleName(row.employeeName),
    employeeName: row.employeeName,
    position: row.position,
    shift: row.shift,
    shiftCode: row.shiftCode,
    days: row.days,
  }))
}

function saveSchedule(schedule: MonthlySchedule): MonthlySchedule {
  saveMonthlyScheduleRecord(schedule)
  emitRealtime({ scope: 'monthly-schedule', action: 'updated', scheduleId: schedule.id })
  return schedule
}

export function listMonthlySchedules(): MonthlySchedule[] {
  return loadAllMonthlySchedules().sort((a, b) => b.year - a.year || b.month - a.month)
}

export function getMonthlyScheduleById(id: string): MonthlySchedule | null {
  return loadMonthlyScheduleRecord(id)
}

export function getMonthlyScheduleByYearMonth(year: number, month: number): MonthlySchedule | null {
  return loadAllMonthlySchedules().find((schedule) => schedule.year === year && schedule.month === month) ?? null
}

export function importMonthlySchedule(
  input: ImportMonthlyScheduleInput,
  file?: Express.Multer.File,
): MonthlySchedule {
  const id = scheduleKey(input.year, input.month)
  const existing = loadMonthlyScheduleRecord(id)
  const now = new Date().toISOString()

  let attachment = input.attachment ?? null
  if (file) {
    removeAttachmentFile(existing?.attachment ?? null)
    attachment = buildAttachmentFromUpload(file)
  } else if (existing?.attachment && !input.attachment) {
    attachment = existing.attachment
  }

  const schedule: MonthlySchedule = {
    id,
    year: input.year,
    month: input.month,
    label: input.label,
    daysInMonth: input.daysInMonth,
    weekdayLabels: input.weekdayLabels,
    rows: mapImportRows(input.rows),
    attachment,
    updatedAt: now,
  }

  return saveSchedule(schedule)
}

export function updateMonthlyDay(input: UpdateMonthlyDayInput): MonthlySchedule {
  const schedule = loadMonthlyScheduleRecord(input.scheduleId)
  if (!schedule) {
    throw new Error('Escala mensal não encontrada.')
  }

  const row = schedule.rows.find((item) => item.id === input.rowId)
  if (!row) {
    throw new Error('Colaborador não encontrado na escala.')
  }

  const dayIndex = row.days.findIndex((day) => day.day === input.day)
  if (dayIndex === -1) {
    throw new Error('Dia inválido na escala.')
  }

  const currentDay = row.days[dayIndex]
  if (!currentDay) {
    throw new Error('Dia inválido na escala.')
  }

  row.days[dayIndex] =
    input.status === 'work'
      ? { day: currentDay.day, status: 'work' }
      : {
          day: currentDay.day,
          status: input.status,
          note: input.status === 'off' ? 'X' : currentDay.note || MONTHLY_DAY_STATUS_LABELS[input.status],
        }

  schedule.updatedAt = new Date().toISOString()
  return saveSchedule(schedule)
}

export function swapMonthlyDays(input: SwapMonthlyDaysInput): MonthlySchedule {
  const schedule = loadMonthlyScheduleRecord(input.scheduleId)
  if (!schedule) {
    throw new Error('Escala mensal não encontrada.')
  }

  const sourceRow = schedule.rows.find((row) => row.id === input.sourceRowId)
  const targetRow = schedule.rows.find((row) => row.id === input.targetRowId)
  if (!sourceRow || !targetRow) {
    throw new Error('Colaborador não encontrado na escala.')
  }

  const sourceDayIndex = sourceRow.days.findIndex((day) => day.day === input.sourceDay)
  const targetDayIndex = targetRow.days.findIndex((day) => day.day === input.targetDay)
  if (sourceDayIndex === -1 || targetDayIndex === -1) {
    throw new Error('Dia inválido na escala.')
  }

  const sourceDay = sourceRow.days[sourceDayIndex]
  const targetDay = targetRow.days[targetDayIndex]
  if (!sourceDay || !targetDay) {
    throw new Error('Dia inválido na escala.')
  }

  sourceRow.days[sourceDayIndex] = { ...targetDay, day: sourceDay.day }
  targetRow.days[targetDayIndex] = { ...sourceDay, day: targetDay.day }

  schedule.updatedAt = new Date().toISOString()
  return saveSchedule(schedule)
}

export function toggleMonthlyDay(scheduleId: string, rowId: string, day: number): MonthlySchedule {
  const schedule = loadMonthlyScheduleRecord(scheduleId)
  const row = schedule?.rows.find((item) => item.id === rowId)
  const dayCell = row?.days.find((item) => item.day === day)
  if (!schedule || !dayCell) {
    throw new Error('Dia inválido na escala.')
  }

  return updateMonthlyDay({
    scheduleId,
    rowId,
    day,
    status: nextDayStatus(dayCell.status),
  })
}
