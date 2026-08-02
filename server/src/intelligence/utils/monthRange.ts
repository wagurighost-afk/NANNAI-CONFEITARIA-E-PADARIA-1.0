/**
 * Intervalo de datas ISO para filtros mensais no banco.
 * @module intelligence/utils/monthRange
 */

export function monthDateRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const endMonth = month === 12 ? 1 : month + 1
  const endYear = month === 12 ? year + 1 : year
  const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`
  return { start, end }
}
