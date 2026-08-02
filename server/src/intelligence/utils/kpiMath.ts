/**
 * Utilitários numéricos para KPIs.
 * @module intelligence/utils/kpiMath
 */

export function round(value: number, digits = 2): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export function percent(part: number, total: number): number {
  if (total <= 0) {
    return 0
  }
  return round((part / total) * 100)
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
}
