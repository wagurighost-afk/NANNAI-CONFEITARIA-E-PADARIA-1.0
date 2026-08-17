import { randomUUID } from 'node:crypto'
import { safeAudit } from './audit/safeAudit.js'
import type { AuditActor } from './audit/types.js'
import {
  loadEmployeeAbsenceRecord,
  loadEmployeeAbsencesByEmployee,
  loadEmployeeAbsencesOverlappingRange,
  saveEmployeeAbsenceRecord,
} from './db/index.js'
import type {
  EmployeeAbsencePeriod,
  EmployeeAbsenceType,
} from './types.js'

const ABSENCE_TYPES = new Set<EmployeeAbsenceType>([
  'VACATION',
  'LEAVE',
  'SICK_LEAVE',
  'OTHER',
])

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export interface CreateEmployeeAbsenceInput {
  employeeId: string
  type: EmployeeAbsenceType
  startDate: string
  endDate: string
  notes?: string
}

export interface UpdateEmployeeAbsenceInput {
  type?: EmployeeAbsenceType
  startDate?: string
  endDate?: string
  notes?: string
}

export class EmployeeAbsenceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'EmployeeAbsenceError'
  }
}

function normalizeEmployeeId(value: unknown): string {
  const employeeId = String(value ?? '').trim()

  if (!employeeId) {
    throw new EmployeeAbsenceError('Colaborador é obrigatório.', 400)
  }

  if (employeeId.length > 120) {
    throw new EmployeeAbsenceError('Identificador do colaborador é inválido.', 400)
  }

  return employeeId
}

function normalizeType(value: unknown): EmployeeAbsenceType {
  const type = String(value ?? '').trim() as EmployeeAbsenceType

  if (!ABSENCE_TYPES.has(type)) {
    throw new EmployeeAbsenceError('Tipo de ausência inválido.', 400)
  }

  return type
}

function normalizeDate(value: unknown, label: string): string {
  const raw = String(value ?? '').trim()

  if (!DATE_RE.test(raw)) {
    throw new EmployeeAbsenceError(
      `${label} deve estar no formato YYYY-MM-DD.`,
      400,
    )
  }

  const [year, month, day] = raw.split('-').map(Number)

  if (
    !year ||
    !month ||
    !day ||
    year < 2000 ||
    year > 2100
  ) {
    throw new EmployeeAbsenceError(`${label} é inválida.`, 400)
  }

  const parsed = new Date(Date.UTC(year, month - 1, day))

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    throw new EmployeeAbsenceError(`${label} é inválida.`, 400)
  }

  return raw
}

function validatePeriod(startDate: string, endDate: string): void {
  if (endDate < startDate) {
    throw new EmployeeAbsenceError(
      'A data final não pode ser anterior à data inicial.',
      400,
    )
  }
}

function normalizeNotes(value: unknown): string {
  const notes = String(value ?? '').trim()

  if (notes.length > 1000) {
    throw new EmployeeAbsenceError(
      'Observações devem ter no máximo 1000 caracteres.',
      400,
    )
  }

  return notes
}

function normalizeCancellationReason(value: unknown): string {
  const reason = String(value ?? '').trim()

  if (!reason) {
    throw new EmployeeAbsenceError(
      'Informe o motivo do cancelamento.',
      400,
    )
  }

  if (reason.length > 500) {
    throw new EmployeeAbsenceError(
      'Motivo do cancelamento deve ter no máximo 500 caracteres.',
      400,
    )
  }

  return reason
}

async function ensureNoActiveOverlap(
  employeeId: string,
  startDate: string,
  endDate: string,
  excludeId?: string,
): Promise<void> {
  const absences = await loadEmployeeAbsencesByEmployee(employeeId)

  const conflict = absences.find(
    (absence) =>
      absence.id !== excludeId &&
      absence.cancelledAt === null &&
      absence.startDate <= endDate &&
      absence.endDate >= startDate,
  )

  if (!conflict) {
    return
  }

  throw new EmployeeAbsenceError(
    `Já existe um período ativo de ausência entre ${conflict.startDate} e ${conflict.endDate}.`,
    409,
  )
}

export async function getEmployeeAbsenceById(
  id: string,
): Promise<EmployeeAbsencePeriod> {
  const absence = await loadEmployeeAbsenceRecord(id)

  if (!absence) {
    throw new EmployeeAbsenceError(
      'Período de ausência não encontrado.',
      404,
    )
  }

  return absence
}

export async function listEmployeeAbsencesByEmployee(
  employeeIdInput: string,
  includeCancelled = false,
): Promise<EmployeeAbsencePeriod[]> {
  const employeeId = normalizeEmployeeId(employeeIdInput)
  const absences = await loadEmployeeAbsencesByEmployee(employeeId)

  return includeCancelled
    ? absences
    : absences.filter((absence) => absence.cancelledAt === null)
}

export async function listEmployeeAbsencesByRange(
  startDateInput: string,
  endDateInput: string,
  includeCancelled = false,
): Promise<EmployeeAbsencePeriod[]> {
  const startDate = normalizeDate(startDateInput, 'Data inicial')
  const endDate = normalizeDate(endDateInput, 'Data final')

  validatePeriod(startDate, endDate)

  const absences = await loadEmployeeAbsencesOverlappingRange(
    startDate,
    endDate,
  )

  return includeCancelled
    ? absences
    : absences.filter((absence) => absence.cancelledAt === null)
}

export async function createEmployeeAbsence(
  input: CreateEmployeeAbsenceInput,
  actor: AuditActor,
): Promise<EmployeeAbsencePeriod> {
  const employeeId = normalizeEmployeeId(input.employeeId)
  const type = normalizeType(input.type)
  const startDate = normalizeDate(input.startDate, 'Data inicial')
  const endDate = normalizeDate(input.endDate, 'Data final')
  const notes = normalizeNotes(input.notes)

  validatePeriod(startDate, endDate)

  await ensureNoActiveOverlap(
    employeeId,
    startDate,
    endDate,
  )

  const now = new Date().toISOString()

  const absence: EmployeeAbsencePeriod = {
    id: `abs-${randomUUID()}`,
    employeeId,
    type,
    startDate,
    endDate,
    notes,
    createdBy: actor.userId,
    createdAt: now,
    updatedAt: now,
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
  }

  await saveEmployeeAbsenceRecord(absence)

  await safeAudit(actor, {
    entityType: 'employee_absence',
    entityId: absence.id,
    action: 'create',
    summary: `Período de ausência criado para ${employeeId}.`,
    before: null,
    after: absence,
  })

  return absence
}

export async function updateEmployeeAbsence(
  id: string,
  input: UpdateEmployeeAbsenceInput,
  actor: AuditActor,
): Promise<EmployeeAbsencePeriod> {
  const existing = await getEmployeeAbsenceById(id)

  if (existing.cancelledAt !== null) {
    throw new EmployeeAbsenceError(
      'Um período cancelado não pode ser alterado.',
      409,
    )
  }

  const hasChanges =
    input.type !== undefined ||
    input.startDate !== undefined ||
    input.endDate !== undefined ||
    input.notes !== undefined

  if (!hasChanges) {
    throw new EmployeeAbsenceError(
      'Nenhuma alteração foi informada.',
      400,
    )
  }

  const type =
    input.type === undefined
      ? existing.type
      : normalizeType(input.type)

  const startDate =
    input.startDate === undefined
      ? existing.startDate
      : normalizeDate(input.startDate, 'Data inicial')

  const endDate =
    input.endDate === undefined
      ? existing.endDate
      : normalizeDate(input.endDate, 'Data final')

  const notes =
    input.notes === undefined
      ? existing.notes
      : normalizeNotes(input.notes)

  validatePeriod(startDate, endDate)

  await ensureNoActiveOverlap(
    existing.employeeId,
    startDate,
    endDate,
    existing.id,
  )

  const updated: EmployeeAbsencePeriod = {
    ...existing,
    type,
    startDate,
    endDate,
    notes,
    updatedAt: new Date().toISOString(),
  }

  await saveEmployeeAbsenceRecord(updated)

  await safeAudit(actor, {
    entityType: 'employee_absence',
    entityId: updated.id,
    action: 'update',
    summary: `Período de ausência atualizado para ${updated.employeeId}.`,
    before: existing,
    after: updated,
  })

  return updated
}

export async function cancelEmployeeAbsence(
  id: string,
  reasonInput: string,
  actor: AuditActor,
): Promise<EmployeeAbsencePeriod> {
  const existing = await getEmployeeAbsenceById(id)

  if (existing.cancelledAt !== null) {
    return existing
  }

  const cancellationReason =
    normalizeCancellationReason(reasonInput)

  const now = new Date().toISOString()

  const cancelled: EmployeeAbsencePeriod = {
    ...existing,
    cancelledAt: now,
    cancelledBy: actor.userId,
    cancellationReason,
    updatedAt: now,
  }

  await saveEmployeeAbsenceRecord(cancelled)

  await safeAudit(actor, {
    entityType: 'employee_absence',
    entityId: cancelled.id,
    action: 'status_change',
    summary: `Período de ausência cancelado para ${cancelled.employeeId}.`,
    before: existing,
    after: cancelled,
  })

  return cancelled
}