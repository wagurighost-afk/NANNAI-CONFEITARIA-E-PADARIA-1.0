/**
 * Utilitários de período para KPIs.
 * @module intelligence/utils/period
 */

import type { IntelligencePeriod } from '../types.js'
import type { ProductionDay } from '../../types.js'

export function monthPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-`
}

export function todayIsoDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function filterProductionsInPeriod(
  productions: ProductionDay[],
  period: IntelligencePeriod,
): ProductionDay[] {
  const prefix = monthPrefix(period.year, period.month)
  return productions.filter((item) => item.date.startsWith(prefix))
}

export function isProductionDelayed(production: ProductionDay, today: string): boolean {
  return production.date < today && production.progress < 100
}

export function isProductionPending(production: ProductionDay, today: string): boolean {
  return production.date >= today && production.progress < 100
}

export function isProductionCompleted(production: ProductionDay): boolean {
  return production.progress >= 100
}

export function hoursBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0
  }
  return (end - start) / (1000 * 60 * 60)
}
