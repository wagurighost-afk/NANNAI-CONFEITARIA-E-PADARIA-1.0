/** Utilitários de período do Painel Executivo (fuso operacional Brasília). */

export const OPERATIONAL_TIMEZONE = 'America/Sao_Paulo'

export type ExecutivePeriodPreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'current_month'
  | 'custom'

export interface ExecutiveDateRange {
  preset: ExecutivePeriodPreset
  from: string
  to: string
}

const PRESETS = new Set<ExecutivePeriodPreset>([
  'today',
  'yesterday',
  'last_7_days',
  'last_30_days',
  'current_month',
  'custom',
])

export function getOperationalTodayIso(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: OPERATIONAL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function parseIsoDate(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return null
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isFinite(year) || month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }
  return { year, month, day }
}

export function addDaysIso(isoDate: string, deltaDays: number): string {
  const parts = parseIsoDate(isoDate)
  if (!parts) {
    return isoDate
  }
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
  utc.setUTCDate(utc.getUTCDate() + deltaDays)
  const year = utc.getUTCFullYear()
  const month = String(utc.getUTCMonth() + 1).padStart(2, '0')
  const day = String(utc.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function listDatesInclusive(from: string, to: string): string[] {
  if (from > to) {
    return []
  }
  const dates: string[] = []
  let cursor = from
  while (cursor <= to) {
    dates.push(cursor)
    cursor = addDaysIso(cursor, 1)
    if (dates.length > 400) {
      break
    }
  }
  return dates
}

export function listYearMonthsInclusive(from: string, to: string): Array<{ year: number; month: number }> {
  const start = parseIsoDate(from)
  const end = parseIsoDate(to)
  if (!start || !end) {
    return []
  }

  const result: Array<{ year: number; month: number }> = []
  let year = start.year
  let month = start.month
  while (year < end.year || (year === end.year && month <= end.month)) {
    result.push({ year, month })
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
    if (result.length > 36) {
      break
    }
  }
  return result
}

export function resolveExecutiveDateRange(input: {
  preset?: string
  from?: string
  to?: string
}): ExecutiveDateRange {
  const today = getOperationalTodayIso()
  const preset = PRESETS.has(input.preset as ExecutivePeriodPreset)
    ? (input.preset as ExecutivePeriodPreset)
    : 'today'

  if (preset === 'custom') {
    const from = parseIsoDate(input.from ?? '') ? input.from! : today
    const to = parseIsoDate(input.to ?? '') ? input.to! : from
    return from <= to ? { preset, from, to } : { preset, from: to, to: from }
  }

  if (preset === 'yesterday') {
    const yesterday = addDaysIso(today, -1)
    return { preset, from: yesterday, to: yesterday }
  }

  if (preset === 'last_7_days') {
    return { preset, from: addDaysIso(today, -6), to: today }
  }

  if (preset === 'last_30_days') {
    return { preset, from: addDaysIso(today, -29), to: today }
  }

  if (preset === 'current_month') {
    const parts = parseIsoDate(today)!
    const from = `${parts.year}-${String(parts.month).padStart(2, '0')}-01`
    return { preset, from, to: today }
  }

  return { preset: 'today', from: today, to: today }
}
