import type {
  WasteActorSnapshot,
  WasteBuffetType,
  WasteControlDay,
  WasteDayStatus,
  WasteMealRecord,
  WastePhase,
  WastePhaseRecord,
} from '../types.js'
import { isWasteControlSector, type WasteControlSector } from './sectors.js'

const PHASES: WastePhase[] = ['entrada', 'reposicao', 'finalizacao']
const BUFFETS: WasteBuffetType[] = ['cafe', 'cha', 'jantar']

export function emptyPhase(): WastePhaseRecord {
  return { items: [], wasteKgTotal: 0, phaseTotal: 0 }
}

export function emptyMeal(): WasteMealRecord {
  return {
    pax: 0,
    dessertsQty: 0,
    phases: {
      entrada: emptyPhase(),
      reposicao: emptyPhase(),
      finalizacao: emptyPhase(),
    },
    wasteKgTotal: 0,
    dayTotal: 0,
  }
}

export function roundMoney(value: number): number {
  return Math.round(value * 10000) / 10000
}

export function roundKg(value: number): number {
  return Math.round(value * 1000) / 1000
}

export function resolveOperationalDate(day: WasteControlDay): string {
  return day.operationalDate || day.date
}

export function resolveWasteDayStatus(day: WasteControlDay): WasteDayStatus {
  if (day.status === 'FINALIZED' || day.status === 'OPEN') {
    return day.status
  }
  return day.closing ? 'FINALIZED' : 'OPEN'
}

export function isLegacyWasteDay(day: WasteControlDay): boolean {
  return !isWasteControlSector(day.sector)
}

export function actorFromAssignment(
  assignment: WasteControlDay['assignment'],
  fallback?: WasteActorSnapshot | null,
): WasteActorSnapshot | null {
  if (assignment?.responsibleEmployeeId && assignment.responsibleEmployeeName) {
    return {
      id: assignment.responsibleEmployeeId,
      name: assignment.responsibleEmployeeName,
    }
  }
  return fallback ?? null
}

function cloneMeal(meal: WasteMealRecord | undefined): WasteMealRecord {
  if (!meal) {
    return emptyMeal()
  }
  return {
    pax: meal.pax,
    dessertsQty: meal.dessertsQty,
    phases: {
      entrada: meal.phases.entrada,
      reposicao: meal.phases.reposicao,
      finalizacao: meal.phases.finalizacao,
    },
    wasteKgTotal: meal.wasteKgTotal,
    dayTotal: meal.dayTotal,
  }
}

/**
 * Garante meals aninhadas em controles de setor, sem alterar registros legados.
 * Não persiste sozinho — só normaliza a visão em memória.
 */
export function viewWasteControlDay(
  day: WasteControlDay,
  activeBuffet: WasteBuffetType = day.buffet,
): WasteControlDay {
  const operationalDate = resolveOperationalDate(day)
  const status = resolveWasteDayStatus(day)
  const assignment = day.assignment ?? null
  const responsible = assignment
    ? {
        responsibleEmployeeId: assignment.responsibleEmployeeId,
        responsibleEmployeeName: assignment.responsibleEmployeeName,
      }
    : {
        responsibleEmployeeId: day.responsibleEmployeeId ?? null,
        responsibleEmployeeName: day.responsibleEmployeeName ?? null,
      }

  if (isLegacyWasteDay(day)) {
    return {
      ...day,
      operationalDate,
      sector: day.sector ?? null,
      status,
      ...responsible,
      finalizedAt: day.finalizedAt ?? day.closing?.closedAt ?? null,
      finalizedBy: day.finalizedBy ??
        (day.closing
          ? { id: day.closing.closedById, name: day.closing.closedByName }
          : null),
    }
  }

  const meals: Record<WasteBuffetType, WasteMealRecord> = {
    cafe: cloneMeal(day.meals?.cafe),
    cha: cloneMeal(day.meals?.cha),
    jantar: cloneMeal(day.meals?.jantar),
  }

  if (!day.meals) {
    meals[day.buffet] = {
      pax: day.pax,
      dessertsQty: day.dessertsQty,
      phases: day.phases,
      wasteKgTotal: day.wasteKgTotal,
      dayTotal: day.dayTotal,
    }
  }

  const active = meals[activeBuffet] ?? emptyMeal()
  const wasteKgTotal = roundKg(BUFFETS.reduce((sum, buffet) => sum + meals[buffet].wasteKgTotal, 0))
  const dayTotal = roundMoney(BUFFETS.reduce((sum, buffet) => sum + meals[buffet].dayTotal, 0))

  return {
    ...day,
    operationalDate,
    sector: day.sector as WasteControlSector,
    status,
    buffet: activeBuffet,
    meals,
    pax: active.pax,
    dessertsQty: active.dessertsQty,
    phases: active.phases,
    wasteKgTotal,
    dayTotal,
    ...responsible,
    finalizedAt: day.finalizedAt ?? day.closing?.closedAt ?? null,
    finalizedBy: day.finalizedBy ??
      (day.closing
        ? { id: day.closing.closedById, name: day.closing.closedByName }
        : null),
  }
}

export function sumMealTotals(meals: Record<WasteBuffetType, WasteMealRecord>): {
  wasteKgTotal: number
  dayTotal: number
} {
  return {
    wasteKgTotal: roundKg(BUFFETS.reduce((sum, buffet) => sum + meals[buffet].wasteKgTotal, 0)),
    dayTotal: roundMoney(BUFFETS.reduce((sum, buffet) => sum + meals[buffet].dayTotal, 0)),
  }
}

export function flattenPhasesForAnalytics(
  day: WasteControlDay,
): Record<WastePhase, WastePhaseRecord> {
  if (!day.meals) {
    return day.phases
  }

  const phases = {
    entrada: emptyPhase(),
    reposicao: emptyPhase(),
    finalizacao: emptyPhase(),
  }

  for (const buffet of BUFFETS) {
    const meal = day.meals[buffet]
    if (!meal) {
      continue
    }
    for (const phase of PHASES) {
      phases[phase].items.push(...meal.phases[phase].items)
      phases[phase].wasteKgTotal = roundKg(
        phases[phase].wasteKgTotal + meal.phases[phase].wasteKgTotal,
      )
      phases[phase].phaseTotal = roundMoney(
        phases[phase].phaseTotal + meal.phases[phase].phaseTotal,
      )
    }
  }

  return phases
}
