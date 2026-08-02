/**
 * Ordenação e resumo de prioridades dos Alertas Automáticos.
 * @module intelligence/services/smartAlerts/priority
 */

import type { SmartAlert, SmartAlertPriority } from '../../types/smartAlerts.types.js'

const PRIORITY_WEIGHT: Record<SmartAlertPriority, number> = {
  critica: 4,
  alta: 3,
  media: 2,
  baixa: 1,
}

export function compareSmartAlerts(a: SmartAlert, b: SmartAlert): number {
  const weightDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
  if (weightDiff !== 0) {
    return weightDiff
  }
  return a.title.localeCompare(b.title, 'pt-BR')
}

export function summarizeAlertPriorities(
  alerts: SmartAlert[],
): Record<SmartAlertPriority, number> {
  return alerts.reduce(
    (acc, alert) => {
      acc[alert.priority] += 1
      return acc
    },
    { critica: 0, alta: 0, media: 0, baixa: 0 } satisfies Record<SmartAlertPriority, number>,
  )
}
