import type { WeekDay } from '@/features/cleaning-schedule/types/cleaningSchedule.types'
import {
  getOperationalDate,
  OPERATIONAL_TIMEZONE,
} from '@/core/time/operationalDate'

const JS_WEEKDAY_TO_APP: Record<number, WeekDay> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
}

/** Data operacional no formato ISO (YYYY-MM-DD) em America/Recife. */
export function getAppTodayIso(now: Date = new Date()): string {
  return getOperationalDate(now)
}

export interface AppYearMonth {
  year: number
  month: number
}

/** Mês operacional atual, derivado da mesma data usada pelo restante da aplicação. */
export function getAppCurrentYearMonth(): AppYearMonth {
  const parts = getAppTodayIso().split('-').map(Number)
  const year = parts[0]
  const month = parts[1]
  const now = new Date()
  return {
    year: typeof year === 'number' && Number.isFinite(year) ? year : now.getFullYear(),
    month: typeof month === 'number' && Number.isFinite(month) ? month : now.getMonth() + 1,
  }
}

/** @deprecated Use getAppTodayIso() — data operacional é sempre o dia atual. */
export const APP_REFERENCE_DATE = getAppTodayIso()

export function getAppReferenceWeekday(now: Date = new Date()): WeekDay {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: OPERATIONAL_TIMEZONE,
    weekday: 'short',
  }).format(now)
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  return JS_WEEKDAY_TO_APP[map[weekday] ?? 1] ?? 'Segunda'
}

/** @deprecated Use getAppReferenceWeekday(). */
export const APP_REFERENCE_WEEKDAY: WeekDay = getAppReferenceWeekday()

/** Ex.: 29/07/2026 */
export function formatAppReferenceDateBr(): string {
  const [year, month, day] = getAppTodayIso().split('-')
  if (!year || !month || !day) {
    return getAppTodayIso()
  }
  return `${day}/${month}/${year}`
}

/** Horário no fuso operacional do hotel (America/Recife, UTC-3) para seeds e mocks. */
export function appDateTimeAt(hour: number, minute: number, second = 0): string {
  const date = getAppTodayIso()
  const h = String(hour).padStart(2, '0')
  const m = String(minute).padStart(2, '0')
  const s = String(second).padStart(2, '0')
  return `${date}T${h}:${m}:${s}-03:00`
}

/** Instantâneo atual para comentários e registros em tempo real. */
export function getAppNowIso(): string {
  return new Date().toISOString()
}

/** Início do dia operacional (06:00 BRT). */
export function getAppDayStartIso(): string {
  return appDateTimeAt(6, 0)
}
