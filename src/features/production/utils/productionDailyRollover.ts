import { getAppTodayIso } from '@/core/constants/appDate'
import { storage } from '@/core/storage/storage'
import {
  ACTIVE_PRODUCTION_IDS,
  SKIPPED_PRODUCTION_EMPLOYEE_IDS,
} from '@/features/production/constants/activeProduction.constants'
import { PRODUCTION_DIVISION } from '@/features/production/data/productionDivision.data'
import type { ProductionDay } from '@/features/production/types/production.types'
import { buildDailyProduction } from '@/features/production/utils/buildDailyProduction'
import { logger } from '@/core/logger'

const PRODUCTION_ROLLOVER_KEY = 'nannai_production_rollover_date'

export interface ProductionRolloverResult {
  store: ProductionDay[]
  changed: boolean
}

function getLastRolloverDate(): string | null {
  return storage.get(PRODUCTION_ROLLOVER_KEY)
}

function setLastRolloverDate(date: string): void {
  storage.set(PRODUCTION_ROLLOVER_KEY, date)
}

/**
 * A cada novo dia operacional, reinicia as produções ativas para "Pendente",
 * limpa comentários do turno anterior e exige nova verificação da equipe.
 */
export function rolloverProductionsIfNeeded(
  productions: ProductionDay[],
  today: string = getAppTodayIso(),
): ProductionRolloverResult {
  const lastRollover = getLastRolloverDate()

  if (lastRollover === today) {
    return { store: productions, changed: false }
  }

  if (!lastRollover && productions.some((production) => production.date === today)) {
    setLastRolloverDate(today)
    return { store: productions, changed: false }
  }

  const store = [...productions]
  let changed = false

  for (const entry of PRODUCTION_DIVISION) {
    if (SKIPPED_PRODUCTION_EMPLOYEE_IDS.has(entry.employeeId)) {
      continue
    }

    const meta = ACTIVE_PRODUCTION_IDS[entry.employeeId]
    if (!meta) {
      continue
    }

    const index = store.findIndex((production) => production.id === meta.id)
    const existing = index >= 0 ? store[index] : undefined
    const refreshed = buildDailyProduction(entry, meta.id, meta.code, today, existing)

    if (index >= 0) {
      store[index] = refreshed
    } else {
      store.push(refreshed)
    }

    changed = true
  }

  if (changed) {
    setLastRolloverDate(today)
    logger.info('Produções reiniciadas para o novo dia operacional.', { date: today })
  } else if (!lastRollover) {
    setLastRolloverDate(today)
  }

  return { store, changed }
}
