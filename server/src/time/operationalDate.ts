/** Fuso operacional do hotel (Pernambuco). Fonte única no backend. */
export const OPERATIONAL_TIMEZONE = 'America/Recife' as const

/**
 * Dia operacional (YYYY-MM-DD) em America/Recife.
 * Não usar getFullYear/getMonth/getDate do Date local do processo (UTC no Render).
 */
export function getOperationalDate(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: OPERATIONAL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error('Falha ao resolver data operacional em America/Recife.')
  }

  return `${year}-${month}-${day}`
}

/** Alias estável para o domínio de produção. */
export function getTodayIso(now?: Date): string {
  return getOperationalDate(now)
}
