/** Fuso operacional da NANNAI (Brasil). */
export const OPERATIONAL_TIMEZONE = 'America/Sao_Paulo'

/** Data operacional no formato ISO (YYYY-MM-DD), sempre em Brasília. */
export function getOperationalTodayIso(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: OPERATIONAL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}
