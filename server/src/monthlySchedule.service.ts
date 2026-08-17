import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { safeAudit } from './audit/safeAudit.js'
import type { AuditActor } from './audit/types.js'
import { config } from './config.js'
import { matchEmployeeIdByScheduleName } from './data/monthlyScheduleSeed.js'
import {
  loadAllMonthlySchedules,
  loadEmployeeAbsencesOverlappingRange,
  loadMonthlyScheduleRecord,
  saveMonthlyScheduleRecord,
} from './db/index.js'
import { emitRealtime } from './events.js'
import type {
  CreateMonthlyScheduleInput,
  EmployeeAbsencePeriod,
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
  return current === 'work' ? 'off' : 'work'
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

async function saveSchedule(schedule: MonthlySchedule): Promise<MonthlySchedule> {
  await saveMonthlyScheduleRecord(schedule)
  emitRealtime({ scope: 'monthly-schedule', action: 'updated', scheduleId: schedule.id })
  return schedule
}

const MONTH_NAMES = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
] as const

const WEEKDAY_LABELS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'] as const

export class MonthlyScheduleConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MonthlyScheduleConflictError'
  }
}

export class MonthlyScheduleSourceNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MonthlyScheduleSourceNotFoundError'
  }
}

function validateYearMonth(year: number, month: number): void {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error('Ano inválido.')
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('Mês inválido.')
  }
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function formatScheduleDate(
  year: number,
  month: number,
  day: number,
): string {
  return [
    String(year).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')
}

function getAbsenceScheduleStatus(
  absence: EmployeeAbsencePeriod,
): MonthlyDayStatus {
  switch (absence.type) {
    case 'VACATION':
      return 'vacation'
    case 'LEAVE':
    case 'SICK_LEAVE':
      return 'leave'
    case 'OTHER':
      return 'other'
  }
}

function getAbsenceLabel(
  absence: EmployeeAbsencePeriod,
): string {
  switch (absence.type) {
    case 'VACATION':
      return 'Férias'
    case 'LEAVE':
      return 'Licença/Afastamento'
    case 'SICK_LEAVE':
      return 'Afastamento médico'
    case 'OTHER':
      return 'Outro afastamento'
  }
}

async function getMonthlyScheduleBaseByYearMonth(
  year: number,
  month: number,
): Promise<MonthlySchedule | null> {
  const schedules = await loadAllMonthlySchedules()

  return (
    schedules.find(
      (schedule) =>
        schedule.year === year &&
        schedule.month === month,
    ) ?? null
  )
}

async function applyEmployeeAbsenceOverlay(
  schedule: MonthlySchedule,
): Promise<MonthlySchedule> {
  const startDate = formatScheduleDate(
    schedule.year,
    schedule.month,
    1,
  )

  const endDate = formatScheduleDate(
    schedule.year,
    schedule.month,
    getDaysInMonth(schedule.year, schedule.month),
  )

  const absences = (
    await loadEmployeeAbsencesOverlappingRange(
      startDate,
      endDate,
    )
  ).filter((absence) => absence.cancelledAt === null)

  if (absences.length === 0) {
    return schedule
  }

  const byEmployee = new Map<
    string,
    EmployeeAbsencePeriod[]
  >()

  for (const absence of absences) {
    const current = byEmployee.get(absence.employeeId) ?? []
    current.push(absence)
    byEmployee.set(absence.employeeId, current)
  }

  return {
    ...schedule,
    rows: schedule.rows.map((row) => {
      if (!row.employeeId) {
        return row
      }

      const employeeAbsences =
        byEmployee.get(row.employeeId) ?? []

      if (employeeAbsences.length === 0) {
        return row
      }

      return {
        ...row,
        days: row.days.map((day) => {
          const date = formatScheduleDate(
            schedule.year,
            schedule.month,
            day.day,
          )

          const absence = employeeAbsences.find(
            (item) =>
              item.startDate <= date &&
              item.endDate >= date,
          )

          if (!absence) {
            return day
          }

          const label = getAbsenceLabel(absence)

          return {
            ...day,
            baseStatus: day.status,
            status: getAbsenceScheduleStatus(absence),
            note: absence.notes
              ? `${label}: ${absence.notes}`
              : label,
            origin: 'absence' as const,
            absenceId: absence.id,
          }
        }),
      }
    }),
  }
}

async function getActiveAbsenceForScheduleDay(
  schedule: MonthlySchedule,
  row: MonthlyScheduleRow,
  day: number,
): Promise<EmployeeAbsencePeriod | null> {
  if (!row.employeeId) {
    return null
  }

  const date = formatScheduleDate(
    schedule.year,
    schedule.month,
    day,
  )

  const absences =
    await loadEmployeeAbsencesOverlappingRange(
      date,
      date,
    )

  return (
    absences.find(
      (absence) =>
        absence.employeeId === row.employeeId &&
        absence.cancelledAt === null &&
        absence.startDate <= date &&
        absence.endDate >= date,
    ) ?? null
  )
}

async function assertScheduleDayUnlocked(
  schedule: MonthlySchedule,
  row: MonthlyScheduleRow,
  day: number,
): Promise<void> {
  const absence = await getActiveAbsenceForScheduleDay(
    schedule,
    row,
    day,
  )

  if (!absence) {
    return
  }

  throw new Error(
    'Este dia é controlado por um período oficial de ausência. Edite ou cancele o período de ausência para alterar o status.',
  )
}

function buildWeekdayLabels(year: number, month: number): string[] {
  const daysInMonth = getDaysInMonth(year, month)

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
    return WEEKDAY_LABELS[weekday] ?? ''
  })
}

function buildMonthLabel(year: number, month: number): string {
  return `MÊS: ${MONTH_NAMES[month - 1] ?? month} ${year}`
}

function getPreviousYearMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) {
    return {
      year: year - 1,
      month: 12,
    }
  }

  return {
    year,
    month: month - 1,
  }
}

function copyRowsAsBase(
  source: MonthlySchedule,
  targetDaysInMonth: number,
): MonthlyScheduleRow[] {
  return source.rows.map((row) => {
    const days = Array.from({ length: targetDaysInMonth }, (_, index) => {
      const day = index + 1
      const sourceDay = row.days.find((item) => item.day === day)

      if (sourceDay?.status === 'off') {
        return {
          day,
          status: 'off' as const,
          note: 'X',
        }
      }

      return {
        day,
        status: 'work' as const,
      }
    })

    return {
      id: `msr-${randomUUID()}`,
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      position: row.position,
      shift: row.shift,
      shiftCode: row.shiftCode,
      days,
    }
  })
}

export async function createMonthlySchedule(
  input: CreateMonthlyScheduleInput,
  actor?: AuditActor,
): Promise<MonthlySchedule> {
  validateYearMonth(input.year, input.month)

  const id = scheduleKey(input.year, input.month)
  const existing = await loadMonthlyScheduleRecord(id)

  if (existing) {
    throw new MonthlyScheduleConflictError(
      `Já existe uma escala cadastrada para ${input.month}/${input.year}.`,
    )
  }

  const daysInMonth = getDaysInMonth(input.year, input.month)

  let rows: MonthlyScheduleRow[] = []
  let source: MonthlySchedule | null = null

  if (input.copyPrevious) {
    const previous = getPreviousYearMonth(input.year, input.month)

    source = await getMonthlyScheduleBaseByYearMonth(
      previous.year,
      previous.month,
    )

    if (!source) {
      throw new MonthlyScheduleSourceNotFoundError(
        `Não existe escala do mês anterior (${previous.month}/${previous.year}) para copiar.`,
      )
    }

    rows = copyRowsAsBase(source, daysInMonth)
  }

  const schedule: MonthlySchedule = {
    id,
    year: input.year,
    month: input.month,
    label: buildMonthLabel(input.year, input.month),
    daysInMonth,
    weekdayLabels: buildWeekdayLabels(input.year, input.month),
    rows,
    attachment: null,
    updatedAt: new Date().toISOString(),
  }

  const saved = await saveSchedule(schedule)

  await safeAudit(actor, {
    entityType: 'monthly_schedule',
    entityId: saved.id,
    action: 'create',
    summary: input.copyPrevious
      ? `Escala mensal ${saved.label} criada a partir do mês anterior`
      : `Escala mensal ${saved.label} criada`,
    before: null,
    after: saved,
  })

  return saved
}
export async function listMonthlySchedules(): Promise<MonthlySchedule[]> {
  const schedules = await loadAllMonthlySchedules()
  return schedules.sort((a, b) => b.year - a.year || b.month - a.month)
}

export async function getMonthlyScheduleById(
  id: string,
): Promise<MonthlySchedule | null> {
  const schedule = await loadMonthlyScheduleRecord(id)

  return schedule
    ? applyEmployeeAbsenceOverlay(schedule)
    : null
}

export async function getMonthlyScheduleByYearMonth(
  year: number,
  month: number,
): Promise<MonthlySchedule | null> {
  const schedule =
    await getMonthlyScheduleBaseByYearMonth(year, month)

  return schedule
    ? applyEmployeeAbsenceOverlay(schedule)
    : null
}

export async function importMonthlySchedule(
  input: ImportMonthlyScheduleInput,
  file?: Express.Multer.File,
  actor?: AuditActor,
): Promise<MonthlySchedule> {
  const id = scheduleKey(input.year, input.month)
  const existing = await loadMonthlyScheduleRecord(id)
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

  const saved = await saveSchedule(schedule)
  await safeAudit(actor, {
    entityType: 'monthly_schedule',
    entityId: saved.id,
    action: existing ? 'update' : 'create',
    summary: `Escala mensal ${input.label} importada`,
    before: existing,
    after: saved,
  })
  return saved
}

export async function updateMonthlyDay(
  input: UpdateMonthlyDayInput,
  actor?: AuditActor,
): Promise<MonthlySchedule> {
  const schedule = await loadMonthlyScheduleRecord(input.scheduleId)
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

  if (
    input.status !== 'work' &&
    input.status !== 'off'
  ) {
    throw new Error(
      'Férias e afastamentos devem ser cadastrados como períodos oficiais de ausência.',
    )
  }

  await assertScheduleDayUnlocked(
    schedule,
    row,
    input.day,
  )

  const beforeDay = { ...currentDay }

  row.days[dayIndex] =
    input.status === 'work'
      ? { day: currentDay.day, status: 'work' }
      : {
          day: currentDay.day,
          status: input.status,
          note: input.status === 'off' ? 'X' : currentDay.note || MONTHLY_DAY_STATUS_LABELS[input.status],
        }

  schedule.updatedAt = new Date().toISOString()
  const saved = await saveSchedule(schedule)
  await safeAudit(actor, {
    entityType: 'monthly_schedule',
    entityId: schedule.id,
    action: 'update',
    summary: `Dia ${input.day} da escala atualizado (${row.employeeName})`,
    before: beforeDay,
    after: row.days[dayIndex],
  })
  return saved
}

export async function swapMonthlyDays(input: SwapMonthlyDaysInput, actor?: AuditActor): Promise<MonthlySchedule> {
  const schedule = await loadMonthlyScheduleRecord(input.scheduleId)
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

  await assertScheduleDayUnlocked(
    schedule,
    sourceRow,
    input.sourceDay,
  )

  await assertScheduleDayUnlocked(
    schedule,
    targetRow,
    input.targetDay,
  )

  sourceRow.days[sourceDayIndex] = { ...targetDay, day: sourceDay.day }
  targetRow.days[targetDayIndex] = { ...sourceDay, day: targetDay.day }

  const before = {
    source: { ...sourceDay },
    target: { ...targetDay },
  }

  schedule.updatedAt = new Date().toISOString()
  const saved = await saveSchedule(schedule)
  await safeAudit(actor, {
    entityType: 'monthly_schedule',
    entityId: schedule.id,
    action: 'update',
    summary: `Dias trocados na escala (${sourceRow.employeeName} ↔ ${targetRow.employeeName})`,
    before,
    after: {
      source: sourceRow.days[sourceDayIndex],
      target: targetRow.days[targetDayIndex],
    },
  })
  return saved
}

export async function toggleMonthlyDay(
  scheduleId: string,
  rowId: string,
  day: number,
  actor?: AuditActor,
): Promise<MonthlySchedule> {
  const schedule = await loadMonthlyScheduleRecord(scheduleId)
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
  }, actor)
}
