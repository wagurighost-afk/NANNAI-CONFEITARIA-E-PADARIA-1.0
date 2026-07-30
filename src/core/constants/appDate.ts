import type { WeekDay } from '@/features/cleaning-schedule/types/cleaningSchedule.types'

const JS_WEEKDAY_TO_APP: Record<number, WeekDay> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
}

/** Data operacional no formato ISO (YYYY-MM-DD), fuso local. */
export function getAppTodayIso(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** @deprecated Use getAppTodayIso() — data operacional é sempre o dia atual. */
export const APP_REFERENCE_DATE = getAppTodayIso()

export function getAppReferenceWeekday(): WeekDay {
  return JS_WEEKDAY_TO_APP[new Date().getDay()] ?? 'Segunda'
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
