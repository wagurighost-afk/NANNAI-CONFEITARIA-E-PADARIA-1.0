/**
 * Agregador do Painel Executivo — apenas dados reais do sistema.
 * @module executive-panel/executivePanel.service
 */

import {
  listAuditLogs,
  loadAllLabelRecords,
  loadAllMonthlySchedules,
  loadBreadControlDaysInMonth,
  loadWasteControlDaysInMonth,
} from '../db/index.js'
import { BREAD_PRODUCTS } from '../data/breadProductsSeed.js'
import { SEED_EMPLOYEES } from '../data/employees.js'
import { loadAppSettings } from '../settings/settings.service.js'
import { loadAllProductions } from '../seed.js'
import type {
  BreadControlDay,
  ProductionDay,
  WasteBuffetType,
  WasteControlDay,
  WastePhase,
} from '../types.js'
import { clearExecutivePanelCache, getExecutivePanelCache, setExecutivePanelCache } from './cache.js'
import {
  getOperationalTodayIso,
  listDatesInclusive,
  listYearMonthsInclusive,
  resolveExecutiveDateRange,
  type ExecutiveDateRange,
} from './period.js'
import type {
  ExecutiveAlert,
  ExecutiveAuditItem,
  ExecutivePanelReport,
  ExecutiveProductionDayPoint,
  ExecutiveWasteChartPoint,
} from './types.js'

const WASTE_PHASES: WastePhase[] = ['entrada', 'reposicao', 'finalizacao']
const BUFFET_LABELS: Record<WasteBuffetType, string> = {
  cafe: 'Café da Manhã',
  cha: 'Chá da Tarde',
  jantar: 'Jantar',
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function percent(part: number, total: number): number {
  if (total <= 0) {
    return 0
  }
  return round((part / total) * 100, 1)
}

function isCompleted(production: ProductionDay): boolean {
  return production.progress >= 100
}

function isDelayed(production: ProductionDay, today: string): boolean {
  return production.date < today && production.progress < 100
}

function isPending(production: ProductionDay, today: string): boolean {
  return production.date >= today && production.progress < 100
}

function inRange(date: string, range: ExecutiveDateRange): boolean {
  return date >= range.from && date <= range.to
}

async function loadWasteInRange(range: ExecutiveDateRange): Promise<WasteControlDay[]> {
  const months = listYearMonthsInclusive(range.from, range.to)
  const chunks = await Promise.all(
    months.map(({ year, month }) => loadWasteControlDaysInMonth(year, month)),
  )
  return chunks.flat().filter((day) => inRange(day.date, range))
}

async function loadBreadInRange(range: ExecutiveDateRange): Promise<BreadControlDay[]> {
  const months = listYearMonthsInclusive(range.from, range.to)
  const chunks = await Promise.all(
    months.map(({ year, month }) => loadBreadControlDaysInMonth(year, month)),
  )
  return chunks.flat().filter((day) => inRange(day.date, range))
}

function computePax(wasteDays: WasteControlDay[], breadDays: BreadControlDay[]): number {
  const byDate = new Map<string, number>()
  for (const day of wasteDays) {
    byDate.set(day.date, Math.max(byDate.get(day.date) ?? 0, day.pax))
  }
  for (const day of breadDays) {
    byDate.set(day.date, Math.max(byDate.get(day.date) ?? 0, day.pax))
  }
  return [...byDate.values()].reduce((sum, value) => sum + value, 0)
}

function buildProductionSection(
  productions: ProductionDay[],
  range: ExecutiveDateRange,
  today: string,
) {
  const planned = productions.length
  const completed = productions.filter(isCompleted).length
  const delayed = productions.filter((item) => isDelayed(item, today)).length
  const pending = productions.filter((item) => isPending(item, today)).length

  const totalItems = productions.reduce((sum, day) => sum + day.items.length, 0)
  const completedItems = productions.reduce(
    (sum, day) => sum + day.items.filter((item) => item.status === 'Concluído').length,
    0,
  )

  const byDate = new Map<string, ExecutiveProductionDayPoint>()
  for (const date of listDatesInclusive(range.from, range.to)) {
    byDate.set(date, { date, planned: 0, completed: 0, pending: 0, delayed: 0 })
  }
  for (const production of productions) {
    const point = byDate.get(production.date)
    if (!point) {
      continue
    }
    point.planned += 1
    if (isCompleted(production)) {
      point.completed += 1
    } else if (isDelayed(production, today)) {
      point.delayed += 1
    } else {
      point.pending += 1
    }
  }

  return {
    planned,
    completed,
    pending,
    delayed,
    efficiencyPercent: percent(completedItems, totalItems),
    dailyChart: [...byDate.values()],
  }
}

function buildBreadSection(breadDays: BreadControlDay[]) {
  let plannedUnits = 0
  let producedUnits = 0

  for (const day of breadDays) {
    if (day.pax > 0) {
      for (const product of BREAD_PRODUCTS) {
        plannedUnits += Math.round(day.pax * product.paxMultiplier)
      }
    }
    producedUnits += day.items.reduce((sum, item) => sum + item.units, 0)
  }

  const difference = producedUnits - plannedUnits
  return {
    plannedUnits,
    producedUnits,
    difference,
    excess: Math.max(0, difference),
    shortage: Math.max(0, -difference),
    daysWithRecords: breadDays.length,
  }
}

function buildWasteSection(wasteDays: WasteControlDay[], range: ExecutiveDateRange) {
  const kg = round(
    wasteDays.reduce((sum, day) => sum + day.wasteKgTotal, 0),
    3,
  )
  const cost = round(wasteDays.reduce((sum, day) => sum + day.dayTotal, 0))

  const productMap = new Map<string, { productId: string; productName: string; kg: number; cost: number }>()
  const buffetMap = new Map<WasteBuffetType, { kg: number; cost: number }>()

  for (const day of wasteDays) {
    const buffet = buffetMap.get(day.buffet) ?? { kg: 0, cost: 0 }
    buffet.kg = round(buffet.kg + day.wasteKgTotal, 3)
    buffet.cost = round(buffet.cost + day.dayTotal)
    buffetMap.set(day.buffet, buffet)

    for (const phase of WASTE_PHASES) {
      for (const item of day.phases[phase].items) {
        if (item.wasteKg <= 0 && item.total <= 0) {
          continue
        }
        const current = productMap.get(item.productId) ?? {
          productId: item.productId,
          productName: item.productName,
          kg: 0,
          cost: 0,
        }
        current.kg = round(current.kg + item.wasteKg, 3)
        current.cost = round(current.cost + item.total)
        productMap.set(item.productId, current)
      }
    }
  }

  const topProduct =
    [...productMap.values()].sort((a, b) => b.kg - a.kg || b.cost - a.cost)[0] ?? null

  const topBuffetEntry = [...buffetMap.entries()].sort((a, b) => b[1].kg - a[1].kg)[0]
  const topBuffet = topBuffetEntry
    ? {
        buffet: topBuffetEntry[0],
        label: BUFFET_LABELS[topBuffetEntry[0]],
        kg: topBuffetEntry[1].kg,
        cost: topBuffetEntry[1].cost,
      }
    : null

  const dayChart: ExecutiveWasteChartPoint[] = listDatesInclusive(range.from, range.to).map((date) => {
    const days = wasteDays.filter((item) => item.date === date)
    return {
      key: date,
      label: date.slice(8, 10),
      kg: round(
        days.reduce((sum, item) => sum + item.wasteKgTotal, 0),
        3,
      ),
      cost: round(days.reduce((sum, item) => sum + item.dayTotal, 0)),
    }
  })

  const weekMap = new Map<string, ExecutiveWasteChartPoint>()
  for (const point of dayChart) {
    const date = new Date(`${point.key}T12:00:00Z`)
    const week = getIsoWeekKey(date)
    const current = weekMap.get(week) ?? { key: week, label: week, kg: 0, cost: 0 }
    current.kg = round(current.kg + point.kg, 3)
    current.cost = round(current.cost + point.cost)
    weekMap.set(week, current)
  }

  const monthMap = new Map<string, ExecutiveWasteChartPoint>()
  for (const day of wasteDays) {
    const key = day.date.slice(0, 7)
    const current = monthMap.get(key) ?? {
      key,
      label: key,
      kg: 0,
      cost: 0,
    }
    current.kg = round(current.kg + day.wasteKgTotal, 3)
    current.cost = round(current.cost + day.dayTotal)
    monthMap.set(key, current)
  }

  return {
    kg,
    cost,
    topProduct,
    topBuffet,
    charts: {
      day: dayChart,
      week: [...weekMap.values()],
      month: [...monthMap.values()],
    },
  }
}

function getIsoWeekKey(date: Date): string {
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${tmp.getUTCFullYear()}-S${String(weekNo).padStart(2, '0')}`
}

async function buildTeamSection(productions: ProductionDay[], referenceDate: string) {
  const schedules = await loadAllMonthlySchedules()
  const year = Number(referenceDate.slice(0, 4))
  const month = Number(referenceDate.slice(5, 7))
  const day = Number(referenceDate.slice(8, 10))
  const schedule = schedules.find((item) => item.year === year && item.month === month)

  let present = 0
  let absent = 0
  let onVacation = 0
  let source: 'schedule' | 'seed-fallback' = 'seed-fallback'
  let note: string | undefined

  if (schedule && schedule.rows.length > 0) {
    source = 'schedule'
    for (const row of schedule.rows) {
      const status = row.days.find((entry) => entry.day === day)?.status
      if (status === 'work') {
        present += 1
      } else if (status === 'vacation') {
        onVacation += 1
      } else if (status === 'off' || status === 'leave' || status === 'other') {
        absent += 1
      } else {
        absent += 1
      }
    }
  } else {
    present = SEED_EMPLOYEES.length
    note = 'Sem escala mensal para o dia de referência — contagem baseada no cadastro operacional.'
  }

  const byEmployee = new Map<string, { done: number; total: number }>()
  for (const production of productions) {
    const current = byEmployee.get(production.employeeId) ?? { done: 0, total: 0 }
    current.total += production.items.length
    current.done += production.items.filter((item) => item.status === 'Concluído').length
    byEmployee.set(production.employeeId, current)
  }
  const productivityValues = [...byEmployee.values()]
    .filter((item) => item.total > 0)
    .map((item) => percent(item.done, item.total))
  const averageProductivityPercent =
    productivityValues.length > 0
      ? round(productivityValues.reduce((sum, value) => sum + value, 0) / productivityValues.length, 1)
      : 0

  return {
    present,
    absent,
    onVacation,
    averageProductivityPercent,
    source,
    ...(note ? { note } : {}),
  }
}

function toAuditItem(log: {
  id: string
  createdAt: string
  action: string
  summary: string
  entityType: string
  actor: { userName: string }
}): ExecutiveAuditItem {
  return {
    id: log.id,
    at: log.createdAt,
    action: log.action,
    summary: log.summary,
    actorName: log.actor.userName,
    entityType: log.entityType,
  }
}

function buildAlerts(input: {
  production: ReturnType<typeof buildProductionSection>
  waste: ReturnType<typeof buildWasteSection>
  costs: { cmvTargetPercent: number; periodWasteCost: number; wasteTargetKgMonthly: number }
  bread: ReturnType<typeof buildBreadSection>
  today: string
}): ExecutiveAlert[] {
  const alerts: ExecutiveAlert[] = []
  const now = new Date().toISOString()

  if (input.production.delayed > 0) {
    alerts.push({
      id: 'alert-production-delayed',
      priority: 'critico',
      title: 'Produção atrasada',
      description: `${input.production.delayed} produção(ões) com data anterior a hoje ainda incompletas.`,
      owner: 'Chef de Confeitaria',
      at: now,
      tone: 'danger',
    })
  }

  if (input.waste.kg > 0 && input.costs.wasteTargetKgMonthly > 0) {
    const daysInMonth = 30
    const dailyTarget = input.costs.wasteTargetKgMonthly / daysInMonth
    if (input.waste.kg > dailyTarget * 1.25) {
      alerts.push({
        id: 'alert-waste-high',
        priority: 'alto',
        title: 'Alto desperdício',
        description: `${input.waste.kg.toFixed(2)} kg no período — acima da meta proporcional de desperdício.`,
        owner: 'Gerente Geral',
        at: now,
        tone: 'warning',
      })
    }
  }

  if (input.bread.shortage > 0) {
    alerts.push({
      id: 'alert-bread-shortage',
      priority: 'alto',
      title: 'Falta de pães',
      description: `Produção realizada abaixo do previsto em ${input.bread.shortage} unidade(s).`,
      owner: 'Chef Executivo',
      at: now,
      tone: 'warning',
    })
  }

  if (input.production.planned > 0 && input.production.completed === input.production.planned) {
    alerts.push({
      id: 'alert-production-done',
      priority: 'baixo',
      title: 'Produção finalizada',
      description: 'Todas as produções do período foram concluídas.',
      owner: 'Chef de Confeitaria',
      at: now,
      tone: 'ok',
    })
  }

  return alerts
}

export async function getExecutivePanelReport(query: {
  preset?: string
  from?: string
  to?: string
}): Promise<ExecutivePanelReport> {
  const range = resolveExecutiveDateRange(query)
  const cacheKey = `${range.preset}:${range.from}:${range.to}`
  const cached = getExecutivePanelCache(cacheKey)
  if (cached) {
    return cached
  }

  const today = getOperationalTodayIso()
  const [
    allProductions,
    wasteDays,
    breadDays,
    labels,
    auditResult,
    settings,
    monthWasteDays,
  ] = await Promise.all([
    loadAllProductions(),
    loadWasteInRange(range),
    loadBreadInRange(range),
    loadAllLabelRecords(),
    listAuditLogs({ limit: 12, offset: 0 }),
    loadAppSettings(),
    loadWasteControlDaysInMonth(Number(today.slice(0, 4)), Number(today.slice(5, 7))),
  ])

  const productions = allProductions.filter((item) => inRange(item.date, range))
  const production = buildProductionSection(productions, range, today)
  const bread = buildBreadSection(breadDays)
  const waste = buildWasteSection(wasteDays, range)
  const totalPax = computePax(wasteDays, breadDays)
  const team = await buildTeamSection(productions, range.to > today ? today : range.to)

  const dayWasteCost = round(
    monthWasteDays.filter((day) => day.date === today).reduce((sum, day) => sum + day.dayTotal, 0),
  )
  const monthWasteCost = round(monthWasteDays.reduce((sum, day) => sum + day.dayTotal, 0))

  const labelsToday = labels.filter((label) => label.printedAt.slice(0, 10) === today)
  const labelsInPeriod = labels.filter((label) => {
    const printedDay = label.printedAt.slice(0, 10)
    return inRange(printedDay, range)
  })
  const lastLabel = [...labels].sort((a, b) => b.printedAt.localeCompare(a.printedAt))[0] ?? null

  const history = auditResult.items.map(toAuditItem)
  const costs = {
    cmvAvailable: false,
    cmvTargetPercent: settings.goals.cmvTargetPercent,
    cmvCurrentPercent: null,
    cmvDifferencePercent: null,
    dayWasteCost,
    periodWasteCost: waste.cost,
    monthWasteCost,
    note: 'CMV atual depende do módulo de custos (ainda não implementado). Valores exibidos de custo vêm do desperdício real lançado.',
  }

  const report: ExecutivePanelReport = {
    generatedAt: new Date().toISOString(),
    range,
    summary: {
      totalProductions: production.planned,
      totalPax,
      wasteKg: waste.kg,
      wasteCost: waste.cost,
      cmvTargetPercent: costs.cmvTargetPercent,
      cmvCurrentPercent: null,
      efficiencyPercent: production.efficiencyPercent,
      activeEmployees: team.present,
    },
    occupancy: {
      available: false,
      note: 'UH, entradas, saídas, adultos e crianças aguardam integração de ocupação hoteleira. PAX atual vem dos lançamentos reais de desperdício e pães.',
      pax: totalPax,
      uhOccupied: null,
      checkIns: null,
      checkOuts: null,
      adults: null,
      children: null,
    },
    production,
    bread,
    waste,
    costs,
    team,
    audit: {
      lastAudit: history[0] ?? null,
      scoreAvailable: false,
      score: null,
      history,
      pendingCount: production.delayed + production.pending,
      note: 'Nota de auditoria ainda não é registrada no sistema. Histórico mostra eventos reais do log de auditoria.',
    },
    inventory: {
      available: false,
      criticalItems: null,
      belowMinimum: null,
      expiringSoon: null,
      note: 'Módulo de estoque ainda não implementado.',
    },
    labels: {
      issuedToday: labelsToday.length,
      issuedInPeriod: labelsInPeriod.length,
      pendingAvailable: false,
      pending: null,
      lastPrintedAt: lastLabel?.printedAt ?? null,
      lastProductName: lastLabel?.data.productName ?? null,
    },
    alerts: buildAlerts({
      production,
      waste,
      bread,
      costs: {
        cmvTargetPercent: costs.cmvTargetPercent,
        periodWasteCost: waste.cost,
        wasteTargetKgMonthly: settings.goals.wasteTargetKgMonthly,
      },
      today,
    }),
  }

  setExecutivePanelCache(cacheKey, report)
  return report
}

export function invalidateExecutivePanelCache(): void {
  clearExecutivePanelCache()
}
