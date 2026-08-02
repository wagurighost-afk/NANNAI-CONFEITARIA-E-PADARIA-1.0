/**
 * Constantes do módulo de inteligência operacional.
 * @module intelligence/constants
 */

import type { IntelligenceCategory } from './types.js'

export const INTELLIGENCE_CATEGORIES: readonly IntelligenceCategory[] = [
  'kpi',
  'insight',
  'recommendation',
  'trend',
] as const

export const INTELLIGENCE_DEFAULT_LIMIT = 10

export const INTELLIGENCE_MAX_LIMIT = 50

export const INTELLIGENCE_QUERY_KEYS = {
  dashboard: 'intelligence-dashboard',
  kpis: 'intelligence-kpis',
  insights: 'intelligence-insights',
  recommendations: 'intelligence-recommendations',
  trends: 'intelligence-trends',
} as const

export function buildSnapshotId(
  category: IntelligenceCategory,
  year: number,
  month: number,
): string {
  return `intel-${category}-${year}-${String(month).padStart(2, '0')}`
}

export function normalizeLimit(limit?: number): number {
  if (!limit || !Number.isFinite(limit)) {
    return INTELLIGENCE_DEFAULT_LIMIT
  }
  return Math.min(Math.max(1, Math.floor(limit)), INTELLIGENCE_MAX_LIMIT)
}

export function normalizePeriod(year: number, month: number): { year: number; month: number } {
  const safeYear = Number.isFinite(year) ? Math.floor(year) : new Date().getFullYear()
  const safeMonth = Number.isFinite(month) ? Math.min(12, Math.max(1, Math.floor(month))) : new Date().getMonth() + 1
  return { year: safeYear, month: safeMonth }
}
