import { getAppTodayIso } from '@/core/constants/appDate'

export type LabelExpiryStatus = 'ok' | 'soon' | 'today' | 'expired'

export interface LabelExpiryInfo {
  status: LabelExpiryStatus
  label: string
  daysRemaining: number
}

/** Near-expiry window in days (exclusive of "today"). */
const SOON_DAYS = 2

export function getLabelExpiryInfo(expiryDate: string, today = getAppTodayIso()): LabelExpiryInfo {
  const daysRemaining = diffDays(today, expiryDate)

  if (daysRemaining < 0) {
    return { status: 'expired', label: 'Vencida', daysRemaining }
  }
  if (daysRemaining === 0) {
    return { status: 'today', label: 'Vence hoje', daysRemaining }
  }
  if (daysRemaining <= SOON_DAYS) {
    return {
      status: 'soon',
      label: daysRemaining === 1 ? 'Vence amanhã' : `Vence em ${daysRemaining} dias`,
      daysRemaining,
    }
  }
  return { status: 'ok', label: 'Dentro da validade', daysRemaining }
}

function diffDays(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T12:00:00`)
  const to = Date.parse(`${toIso}T12:00:00`)
  if (Number.isNaN(from) || Number.isNaN(to)) {
    return 0
  }
  return Math.round((to - from) / 86_400_000)
}
