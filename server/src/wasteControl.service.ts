import { safeAudit } from './audit/safeAudit.js'
import type { AuditActor } from './audit/types.js'
import { loadWasteControlDay, loadWasteControlDaysInMonth, saveWasteControlDay } from './db/index.js'
import { emitRealtime } from './events.js'
import { isLeadershipUser } from './auth/leadershipAccess.js'
import { listLinkedWasteProducts, resolveWasteProduct } from './wasteControl/catalogLink.js'
import type {
  AppUser,
  AssignWasteResponsibleInput,
  ConferenceWasteDayInput,
  SaveWasteControlDayInput,
  WasteBuffetType,
  WasteConferenceInfo,
  WasteControlDay,
  WasteControlMonthlySummary,
  WasteControlProduct,
  WasteLineItem,
  WastePhase,
  WastePhaseRecord,
  WasteSector,
} from './types.js'

const PHASES: WastePhase[] = ['entrada', 'reposicao', 'finalizacao']

function dayId(date: string, buffet: WasteBuffetType): string {
  return `waste-${buffet}-${date}`
}

function roundMoney(value: number): number {
  return Math.round(value * 10000) / 10000
}

function roundKg(value: number): number {
  return Math.round(value * 1000) / 1000
}

function buildPhaseItems(
  products: WasteControlProduct[],
  items: Array<{ productId: string; units: number; wasteKg: number }>,
): WastePhaseRecord {
  const lineItems: WasteLineItem[] = []
  for (const item of items) {
    const product = resolveWasteProduct(products, item.productId)
    if (!product) {
      continue
    }
    const units = Number.isFinite(item.units) ? Math.max(0, item.units) : 0
    const wasteKg = Number.isFinite(item.wasteKg) ? Math.max(0, item.wasteKg) : 0
    const unitPrice = Number.isFinite(product.unitPrice) ? product.unitPrice : 0
    const total = roundMoney(wasteKg * unitPrice)
    lineItems.push({
      productId: product.id,
      productName: product.name,
      sector: product.sector,
      units,
      wasteKg: roundKg(wasteKg),
      unitPrice,
      total,
      catalogProductId: product.catalogProductId ?? product.id,
    })
  }

  const wasteKgTotal = roundKg(lineItems.reduce((sum, item) => sum + item.wasteKg, 0))
  const phaseTotal = roundMoney(lineItems.reduce((sum, item) => sum + item.total, 0))

  return { items: lineItems, wasteKgTotal, phaseTotal }
}

function emptyPhase(): WastePhaseRecord {
  return { items: [], wasteKgTotal: 0, phaseTotal: 0 }
}

/** Produtos do dia vinculados ao Cadastro de Produtos (custo por porção). */
export async function listWasteProducts(buffet?: WasteBuffetType): Promise<WasteControlProduct[]> {
  return listLinkedWasteProducts(buffet)
}

/** Migra registros antigos que salvavam a meta mensal em kg (campo renomeado para reais). */
function migrateLegacyMonthlyGoal(record: WasteControlDay | null): WasteControlDay | null {
  if (!record || record.monthlyGoalReais !== undefined) {
    return record
  }
  const legacyKg = (record as unknown as { monthlyGoalKg?: number }).monthlyGoalKg
  return { ...record, monthlyGoalReais: typeof legacyKg === 'number' ? legacyKg : 0 }
}

export async function getWasteControlDay(
  date: string,
  buffet: WasteBuffetType,
): Promise<WasteControlDay | null> {
  const record = await loadWasteControlDay(dayId(date, buffet))
  return migrateLegacyMonthlyGoal(record)
}

export async function saveWasteControlDayRecord(
  input: SaveWasteControlDayInput,
  actor?: AuditActor,
): Promise<WasteControlDay> {
  const existing = await loadWasteControlDay(dayId(input.date, input.buffet))
  const products = await listLinkedWasteProducts(input.buffet)
  const phases = PHASES.reduce(
    (acc, phase) => {
      acc[phase] = buildPhaseItems(products, input.phases[phase] ?? [])
      return acc
    },
    {} as Record<WastePhase, WastePhaseRecord>,
  )

  const wasteKgTotal = roundKg(PHASES.reduce((sum, phase) => sum + phases[phase].wasteKgTotal, 0))
  const dayTotal = roundMoney(PHASES.reduce((sum, phase) => sum + phases[phase].phaseTotal, 0))
  const now = new Date().toISOString()

  const record: WasteControlDay = {
    id: dayId(input.date, input.buffet),
    date: input.date,
    buffet: input.buffet,
    pax: Math.max(0, input.pax),
    monthlyGoalReais: Math.max(0, input.monthlyGoalReais),
    dessertsQty: Math.max(0, input.dessertsQty ?? 0),
    phases,
    wasteKgTotal,
    dayTotal,
    updatedAt: now,
    assignment: existing?.assignment ?? null,
    closing: existing?.closing ?? null,
    conference: existing?.conference ?? null,
  }

  if (input.finalize) {
    if (!record.assignment) {
      throw new Error('Selecione o responsável antes de finalizar a contagem.')
    }
    // Quando há um responsável indicado, é ele quem leva o crédito do fechamento
    // (útil quando várias pessoas compartilham o mesmo login/tablet).
    record.closing = {
      closedAt: now,
      closedById: record.assignment.responsibleEmployeeId ?? actor?.userId ?? 'system',
      closedByName: record.assignment.responsibleEmployeeName ?? actor?.userName ?? 'Sistema',
    }
    record.conference = {
      status: 'aguardando_conferencia',
      checkedById: null,
      checkedByName: null,
      checkedAt: null,
      notes: record.conference?.notes ?? '',
    }
  }

  await saveWasteControlDay(record)
  emitRealtime({ scope: 'waste-control', action: 'updated', dayId: record.id })
  await safeAudit(actor, {
    entityType: 'waste_control',
    entityId: record.id,
    action: existing ? 'update' : 'create',
    summary: input.finalize
      ? `Contagem de desperdício (${input.buffet}) finalizada e enviada para conferência`
      : `Controle de desperdício (${input.buffet}) do dia ${input.date} salvo`,
    before: existing,
    after: record,
  })
  return record
}

export async function assignWasteResponsible(
  input: AssignWasteResponsibleInput,
  actor: AuditActor,
): Promise<WasteControlDay> {
  const existing =
    (await loadWasteControlDay(dayId(input.date, input.buffet))) ??
    createEmptyWasteDay(input.date, input.buffet)

  const now = new Date().toISOString()
  const record: WasteControlDay = {
    ...existing,
    assignment: {
      responsibleEmployeeId: input.responsibleEmployeeId,
      responsibleEmployeeName: input.responsibleEmployeeName,
      responsiblePosition: input.responsiblePosition,
      responsibleShift: input.responsibleShift,
      assignedAt: now,
      assignedById: actor.userId,
      assignedByName: actor.userName,
      sector: input.sector,
    },
    updatedAt: now,
  }

  await saveWasteControlDay(record)
  emitRealtime({ scope: 'waste-control', action: 'assigned', dayId: record.id })
  await safeAudit(actor, {
    entityType: 'waste_control',
    entityId: record.id,
    action: 'update',
    summary: `Responsável ${input.responsibleEmployeeName} atribuído ao desperdício (${input.buffet})`,
    before: existing,
    after: record,
  })
  return record
}

export async function conferenceWasteDay(
  input: ConferenceWasteDayInput,
  user: AppUser,
): Promise<WasteControlDay> {
  if (!isLeadershipUser(user)) {
    throw new Error('Somente a liderança pode conferir a contagem.')
  }

  const existing = await loadWasteControlDay(dayId(input.date, input.buffet))
  if (!existing) {
    throw new Error('Contagem não encontrada.')
  }
  if (!existing.closing) {
    throw new Error('Finalize a contagem antes de conferir.')
  }

  const now = new Date().toISOString()
  const conference: WasteConferenceInfo = {
    status: input.status,
    checkedById: user.id,
    checkedByName: user.name,
    checkedAt: now,
    notes: input.notes?.trim() ?? '',
  }

  const record: WasteControlDay = {
    ...existing,
    conference,
    updatedAt: now,
  }

  await saveWasteControlDay(record)
  emitRealtime({ scope: 'waste-control', action: 'conference', dayId: record.id })
  await safeAudit(
    {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      ...(user.employeeId ? { employeeId: user.employeeId } : {}),
    },
    {
      entityType: 'waste_control',
      entityId: record.id,
      action: 'update',
      summary: `Conferência de desperdício (${input.buffet}): ${input.status}`,
      before: existing,
      after: record,
    },
  )
  return record
}

export async function getWasteControlMonthlySummary(
  year: number,
  month: number,
): Promise<WasteControlMonthlySummary> {
  const days = (await loadWasteControlDaysInMonth(year, month))
    .sort((a, b) => a.date.localeCompare(b.date) || a.buffet.localeCompare(b.buffet))
    .map((day) => ({
      date: day.date,
      dayNumber: Number(day.date.slice(8, 10)),
      buffet: day.buffet,
      wasteKgTotal: day.wasteKgTotal,
      dayTotal: day.dayTotal,
      pax: day.pax,
    }))

  const buffetTotals: Record<WasteBuffetType, number> = { cafe: 0, cha: 0, jantar: 0 }
  const sectorTotals: Record<WasteSector, number> = { Confeitaria: 0, Padaria: 0 }
  const phaseTotals: Record<WastePhase, number> = {
    entrada: 0,
    reposicao: 0,
    finalizacao: 0,
  }
  let monthTotal = 0
  let monthWasteKg = 0

  for (const day of await loadWasteControlDaysInMonth(year, month)) {
    monthTotal = roundMoney(monthTotal + day.dayTotal)
    monthWasteKg = roundKg(monthWasteKg + day.wasteKgTotal)
    buffetTotals[day.buffet] = roundMoney(buffetTotals[day.buffet] + day.dayTotal)

    for (const phase of PHASES) {
      phaseTotals[phase] = roundMoney(phaseTotals[phase] + day.phases[phase].phaseTotal)
      for (const item of day.phases[phase].items) {
        sectorTotals[item.sector] = roundMoney(sectorTotals[item.sector] + item.total)
      }
    }
  }

  return {
    year,
    month,
    days,
    buffetTotals,
    sectorTotals,
    phaseTotals,
    monthTotal: roundMoney(monthTotal),
    monthWasteKg: roundKg(monthWasteKg),
  }
}

export function createEmptyWasteDay(date: string, buffet: WasteBuffetType): WasteControlDay {
  return {
    id: dayId(date, buffet),
    date,
    buffet,
    pax: 0,
    monthlyGoalReais: 0,
    dessertsQty: 0,
    phases: {
      entrada: emptyPhase(),
      reposicao: emptyPhase(),
      finalizacao: emptyPhase(),
    },
    wasteKgTotal: 0,
    dayTotal: 0,
    updatedAt: new Date().toISOString(),
    assignment: null,
    closing: null,
    conference: null,
  }
}
