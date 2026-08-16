import { safeAudit } from './audit/safeAudit.js'
import type { AuditActor } from './audit/types.js'
import {
  loadWasteControlDay,
  loadWasteControlDayByDateAndSector,
  loadWasteControlDaysInMonth,
  saveWasteControlDay,
} from './db/index.js'
import { emitRealtime } from './events.js'
import { isLeadershipUser } from './auth/leadershipAccess.js'
import { listLinkedWasteProducts, resolveWasteProduct } from './wasteControl/catalogLink.js'
import {
  emptyMeal,
  flattenPhasesForAnalytics,
  resolveOperationalDate,
  resolveWasteDayStatus,
  roundKg,
  roundMoney,
  sumMealTotals,
  viewWasteControlDay,
} from './wasteControl/normalizeDay.js'
import { wasteControlDayId, type WasteControlSector } from './wasteControl/sectors.js'
import type {
  AppUser,
  AssignWasteResponsibleInput,
  ConferenceWasteDayInput,
  ReopenWasteDayInput,
  SaveWasteControlDayInput,
  WasteActorSnapshot,
  WasteBuffetType,
  WasteConferenceInfo,
  WasteControlDay,
  WasteControlDayOverview,
  WasteControlMonthlySummary,
  WasteControlProduct,
  WasteLineItem,
  WasteMealRecord,
  WastePhase,
  WastePhaseRecord,
  WasteSector,
} from './types.js'

const PHASES: WastePhase[] = ['entrada', 'reposicao', 'finalizacao']
const BUFFETS: WasteBuffetType[] = ['cafe', 'cha', 'jantar']

function productSectorForControl(sector: WasteControlSector): WasteSector {
  return sector === 'PADARIA' ? 'Padaria' : 'Confeitaria'
}

function buildPhaseItems(
  products: WasteControlProduct[],
  items: Array<{ productId: string; units: number; wasteKg: number }>,
  controlSector: WasteControlSector,
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
      sector: productSectorForControl(controlSector),
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

function mealFromPhases(
  pax: number,
  dessertsQty: number,
  phases: Record<WastePhase, WastePhaseRecord>,
): WasteMealRecord {
  return {
    pax: Math.max(0, pax),
    dessertsQty: Math.max(0, dessertsQty),
    phases,
    wasteKgTotal: roundKg(PHASES.reduce((sum, phase) => sum + phases[phase].wasteKgTotal, 0)),
    dayTotal: roundMoney(PHASES.reduce((sum, phase) => sum + phases[phase].phaseTotal, 0)),
  }
}

function emptyMeals(): Record<WasteBuffetType, WasteMealRecord> {
  return {
    cafe: emptyMeal(),
    cha: emptyMeal(),
    jantar: emptyMeal(),
  }
}

function auditContext(sector: WasteControlSector, operationalDate: string): string {
  return `setor=${sector} operationalDate=${operationalDate}`
}

function snapshotActor(actor?: AuditActor): WasteActorSnapshot {
  return {
    id: actor?.userId ?? 'system',
    name: actor?.userName ?? 'Sistema',
  }
}

/** Migra registros antigos que salvavam a meta mensal em kg (campo renomeado para reais). */
function migrateLegacyMonthlyGoal(record: WasteControlDay | null): WasteControlDay | null {
  if (!record || record.monthlyGoalReais !== undefined) {
    return record
  }
  const legacyKg = (record as unknown as { monthlyGoalKg?: number }).monthlyGoalKg
  return { ...record, monthlyGoalReais: typeof legacyKg === 'number' ? legacyKg : 0 }
}

export async function listWasteProducts(
  sector: WasteControlSector,
  buffet?: WasteBuffetType,
): Promise<WasteControlProduct[]> {
  return listLinkedWasteProducts({ sector, ...(buffet ? { buffet } : {}) })
}

export async function getWasteControlDay(
  date: string,
  sector: WasteControlSector,
  buffet: WasteBuffetType = 'cafe',
): Promise<WasteControlDay | null> {
  const record =
    (await loadWasteControlDayByDateAndSector(date, sector)) ??
    (await loadWasteControlDay(wasteControlDayId(date, sector)))
  const migrated = migrateLegacyMonthlyGoal(record)
  return migrated ? viewWasteControlDay(migrated, buffet) : null
}

function assertEditable(day: WasteControlDay): void {
  if (resolveWasteDayStatus(day) === 'FINALIZED') {
    throw new Error('Controle finalizado. Somente a liderança pode reabrir para editar.')
  }
}

export function createEmptyWasteDay(
  date: string,
  sector: WasteControlSector,
  buffet: WasteBuffetType = 'cafe',
): WasteControlDay {
  const meals = emptyMeals()
  const now = new Date().toISOString()
  return viewWasteControlDay(
    {
      id: wasteControlDayId(date, sector),
      date,
      operationalDate: date,
      sector,
      status: 'OPEN',
      buffet,
      pax: 0,
      monthlyGoalReais: 0,
      dessertsQty: 0,
      phases: meals[buffet].phases,
      meals,
      wasteKgTotal: 0,
      dayTotal: 0,
      responsibleEmployeeId: null,
      responsibleEmployeeName: null,
      openedAt: now,
      openedBy: null,
      finalizedAt: null,
      finalizedBy: null,
      createdAt: now,
      updatedAt: now,
      assignment: null,
      closing: null,
      conference: null,
      reopenHistory: [],
    },
    buffet,
  )
}

export async function saveWasteControlDayRecord(
  input: SaveWasteControlDayInput,
  actor?: AuditActor,
): Promise<WasteControlDay> {
  const existing = await getWasteControlDay(input.date, input.sector, input.buffet)
  if (existing) {
    assertEditable(existing)
  }

  const products = await listLinkedWasteProducts({ sector: input.sector, buffet: input.buffet })
  const phases = PHASES.reduce(
    (acc, phase) => {
      acc[phase] = buildPhaseItems(products, input.phases[phase] ?? [], input.sector)
      return acc
    },
    {} as Record<WastePhase, WastePhaseRecord>,
  )

  const now = new Date().toISOString()
  const viewed = existing ?? createEmptyWasteDay(input.date, input.sector, input.buffet)
  const meals = {
    cafe: viewed.meals?.cafe ?? emptyMeal(),
    cha: viewed.meals?.cha ?? emptyMeal(),
    jantar: viewed.meals?.jantar ?? emptyMeal(),
  }
  meals[input.buffet] = mealFromPhases(input.pax, input.dessertsQty ?? 0, phases)
  const totals = sumMealTotals(meals)
  const openedBy = viewed.openedBy ?? (existing ? viewed.openedBy : snapshotActor(actor))

  const record: WasteControlDay = {
    ...viewed,
    id: wasteControlDayId(input.date, input.sector),
    date: input.date,
    operationalDate: input.date,
    sector: input.sector,
    status: 'OPEN',
    buffet: input.buffet,
    pax: meals[input.buffet].pax,
    monthlyGoalReais: Math.max(0, input.monthlyGoalReais),
    dessertsQty: meals[input.buffet].dessertsQty,
    phases: meals[input.buffet].phases,
    meals,
    wasteKgTotal: totals.wasteKgTotal,
    dayTotal: totals.dayTotal,
    responsibleEmployeeId: viewed.assignment?.responsibleEmployeeId ?? viewed.responsibleEmployeeId ?? null,
    responsibleEmployeeName:
      viewed.assignment?.responsibleEmployeeName ?? viewed.responsibleEmployeeName ?? null,
    openedAt: viewed.openedAt ?? viewed.createdAt ?? now,
    openedBy,
    createdAt: viewed.createdAt ?? now,
    updatedAt: now,
    assignment: viewed.assignment ?? null,
    closing: viewed.closing ?? null,
    conference: viewed.conference ?? null,
    reopenHistory: viewed.reopenHistory ?? [],
    finalizedAt: viewed.finalizedAt ?? null,
    finalizedBy: viewed.finalizedBy ?? null,
  }

  if (input.finalize) {
    if (!record.assignment) {
      throw new Error('Selecione o responsável antes de finalizar a contagem.')
    }
    record.status = 'FINALIZED'
    record.closing = {
      closedAt: now,
      closedById: record.assignment.responsibleEmployeeId ?? actor?.userId ?? 'system',
      closedByName: record.assignment.responsibleEmployeeName ?? actor?.userName ?? 'Sistema',
    }
    record.finalizedAt = now
    record.finalizedBy = {
      id: record.closing.closedById,
      name: record.closing.closedByName,
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
    action: existing ? (input.finalize ? 'status_change' : 'update') : 'create',
    summary: input.finalize
      ? `Setor finalizado (${auditContext(input.sector, input.date)})`
      : existing
        ? `Lançamento salvo (${auditContext(input.sector, input.date)})`
        : `Controle aberto (${auditContext(input.sector, input.date)})`,
    before: existing,
    after: record,
  })
  return viewWasteControlDay(record, input.buffet)
}

export async function assignWasteResponsible(
  input: AssignWasteResponsibleInput,
  actor: AuditActor,
): Promise<WasteControlDay> {
  const buffet = input.buffet ?? 'cafe'
  const existing =
    (await getWasteControlDay(input.date, input.sector, buffet)) ??
    createEmptyWasteDay(input.date, input.sector, buffet)
  assertEditable(existing)

  const now = new Date().toISOString()
  const record: WasteControlDay = {
    ...existing,
    id: wasteControlDayId(input.date, input.sector),
    date: input.date,
    operationalDate: input.date,
    sector: input.sector,
    status: 'OPEN',
    responsibleEmployeeId: input.responsibleEmployeeId,
    responsibleEmployeeName: input.responsibleEmployeeName,
    openedAt: existing.openedAt ?? existing.createdAt ?? now,
    openedBy: existing.openedBy ?? snapshotActor(actor),
    createdAt: existing.createdAt ?? now,
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
    action: existing.assignment ? 'update' : 'create',
    summary: `Responsável ${input.responsibleEmployeeName} (${auditContext(input.sector, input.date)})`,
    before: existing,
    after: record,
  })
  return viewWasteControlDay(record, buffet)
}

export async function conferenceWasteDay(
  input: ConferenceWasteDayInput,
  user: AppUser,
): Promise<WasteControlDay> {
  if (!isLeadershipUser(user)) {
    throw new Error('Somente a liderança pode conferir a contagem.')
  }

  const buffet = input.buffet ?? 'cafe'
  const existing = await getWasteControlDay(input.date, input.sector, buffet)
  if (!existing) {
    throw new Error('Contagem não encontrada.')
  }
  if (resolveWasteDayStatus(existing) !== 'FINALIZED' && !existing.closing) {
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
      summary: `Conferência (${input.status}) (${auditContext(input.sector, input.date)})`,
      before: existing,
      after: record,
    },
  )
  return viewWasteControlDay(record, buffet)
}

export async function reopenWasteControlDay(
  input: ReopenWasteDayInput,
  user: AppUser,
): Promise<WasteControlDay> {
  if (!isLeadershipUser(user)) {
    throw new Error('Somente Chef/Admin pode reabrir o controle.')
  }

  const reason = input.reason.trim()
  if (reason.length < 3) {
    throw new Error('Informe o motivo da reabertura.')
  }

  const existing = await getWasteControlDay(input.date, input.sector)
  if (!existing) {
    throw new Error('Contagem não encontrada.')
  }
  if (resolveWasteDayStatus(existing) !== 'FINALIZED') {
    throw new Error('O controle já está em aberto.')
  }

  const now = new Date().toISOString()
  const previousFinalizedAt = existing.finalizedAt ?? existing.closing?.closedAt ?? null
  const previousFinalizedBy = existing.finalizedBy ??
    (existing.closing
      ? { id: existing.closing.closedById, name: existing.closing.closedByName }
      : null)

  const record: WasteControlDay = {
    ...existing,
    status: 'OPEN',
    updatedAt: now,
    reopenHistory: [
      ...(existing.reopenHistory ?? []),
      {
        reopenedAt: now,
        reopenedById: user.id,
        reopenedByName: user.name,
        reason,
        previousFinalizedAt,
        previousFinalizedById: previousFinalizedBy?.id ?? null,
        previousFinalizedByName: previousFinalizedBy?.name ?? null,
      },
    ],
  }

  await saveWasteControlDay(record)
  emitRealtime({ scope: 'waste-control', action: 'reopened', dayId: record.id })
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
      action: 'status_change',
      summary: `Setor reaberto (${auditContext(input.sector, input.date)}): ${reason}`,
      before: existing,
      after: record,
    },
  )
  return viewWasteControlDay(record)
}

export async function getWasteControlMonthlySummary(
  year: number,
  month: number,
): Promise<WasteControlMonthlySummary> {
  const stored = await loadWasteControlDaysInMonth(year, month)
  const days = stored
    .sort(
      (a, b) =>
        resolveOperationalDate(a).localeCompare(resolveOperationalDate(b)) ||
        (a.sector ?? a.buffet).localeCompare(b.sector ?? b.buffet),
    )
    .map((day) => {
      const viewed = viewWasteControlDay(day)
      return {
        date: resolveOperationalDate(viewed),
        dayNumber: Number(resolveOperationalDate(viewed).slice(8, 10)),
        buffet: viewed.buffet,
        sector: viewed.sector ?? null,
        wasteKgTotal: viewed.wasteKgTotal,
        dayTotal: viewed.dayTotal,
        pax: viewed.pax,
      }
    })

  const buffetTotals: Record<WasteBuffetType, number> = { cafe: 0, cha: 0, jantar: 0 }
  const sectorTotals: Record<WasteSector, number> = { Confeitaria: 0, Padaria: 0 }
  const controlSectorTotals = { CONFEITARIA: 0, PADARIA: 0, LEGACY: 0 }
  const phaseTotals: Record<WastePhase, number> = {
    entrada: 0,
    reposicao: 0,
    finalizacao: 0,
  }
  let monthTotal = 0
  let monthWasteKg = 0

  for (const day of stored) {
    const viewed = viewWasteControlDay(day)
    monthTotal = roundMoney(monthTotal + viewed.dayTotal)
    monthWasteKg = roundKg(monthWasteKg + viewed.wasteKgTotal)

    if (viewed.sector === 'CONFEITARIA' || viewed.sector === 'PADARIA') {
      controlSectorTotals[viewed.sector] = roundMoney(
        controlSectorTotals[viewed.sector] + viewed.dayTotal,
      )
      if (viewed.meals) {
        for (const buffet of BUFFETS) {
          buffetTotals[buffet] = roundMoney(buffetTotals[buffet] + (viewed.meals[buffet]?.dayTotal ?? 0))
        }
      } else {
        buffetTotals[viewed.buffet] = roundMoney(buffetTotals[viewed.buffet] + viewed.dayTotal)
      }
    } else {
      controlSectorTotals.LEGACY = roundMoney(controlSectorTotals.LEGACY + viewed.dayTotal)
      buffetTotals[viewed.buffet] = roundMoney(buffetTotals[viewed.buffet] + viewed.dayTotal)
    }

    const phases = flattenPhasesForAnalytics(viewed)
    for (const phase of PHASES) {
      phaseTotals[phase] = roundMoney(phaseTotals[phase] + phases[phase].phaseTotal)
      for (const item of phases[phase].items) {
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
    controlSectorTotals,
    phaseTotals,
    monthTotal: roundMoney(monthTotal),
    monthWasteKg: roundKg(monthWasteKg),
  }
}

export async function getWasteControlOverview(operationalDate: string): Promise<WasteControlDayOverview> {
  const [year, month] = operationalDate.split('-').map(Number)
  const days = await loadWasteControlDaysInMonth(year ?? 2026, month ?? 1)
  const ofDate = days.filter((day) => resolveOperationalDate(day) === operationalDate)

  const confeitariaDay = ofDate.find((day) => day.sector === 'CONFEITARIA')
  const padariaDay = ofDate.find((day) => day.sector === 'PADARIA')
  const confeitaria = confeitariaDay ? viewWasteControlDay(confeitariaDay) : null
  const padaria = padariaDay ? viewWasteControlDay(padariaDay) : null

  const legacyTotal = roundMoney(
    ofDate
      .filter((day) => day.sector !== 'CONFEITARIA' && day.sector !== 'PADARIA')
      .reduce((sum, day) => sum + viewWasteControlDay(day).dayTotal, 0),
  )

  const confeitariaTotal = confeitaria?.dayTotal ?? 0
  const padariaTotal = padaria?.dayTotal ?? 0

  return {
    operationalDate,
    confeitaria: confeitaria
      ? {
          id: confeitaria.id,
          status: resolveWasteDayStatus(confeitaria),
          dayTotal: confeitariaTotal,
          wasteKgTotal: confeitaria.wasteKgTotal,
        }
      : null,
    padaria: padaria
      ? {
          id: padaria.id,
          status: resolveWasteDayStatus(padaria),
          dayTotal: padariaTotal,
          wasteKgTotal: padaria.wasteKgTotal,
        }
      : null,
    consolidatedTotal: roundMoney(confeitariaTotal + padariaTotal),
    legacyTotal,
  }
}
