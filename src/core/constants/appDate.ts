import type { WeekDay } from '@/features/cleaning-schedule/types/cleaningSchedule.types'

/** Fuso operacional da NANNAI (Brasil). Evita divergência com hosts em UTC (ex.: Render). */
export const APP_TIMEZONE = 'America/Sao_Paulo'

const JS_WEEKDAY_TO_APP: Record<string, WeekDay> = {
  Sun: 'Domingo',
  Mon: 'Segunda',
  Tue: 'Terça',
  Wed: 'Quarta',
  Thu: 'Quinta',
  Fri: 'Sexta',
  Sat: 'Sábado',
}

/** Data operacional no formato ISO (YYYY-MM-DD), sempre em Brasília. */
export function getAppTodayIso(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** @deprecated Use getAppTodayIso() — data operacional é sempre o dia atual. */
export const APP_REFERENCE_DATE = getAppTodayIso()

export function getAppReferenceWeekday(now = new Date()): WeekDay {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    weekday: 'short',
  }).format(now)
  return JS_WEEKDAY_TO_APP[weekday] ?? 'Segunda'
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

/** Horário em Brasília (UTC-3) para seeds e mocks. */
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
