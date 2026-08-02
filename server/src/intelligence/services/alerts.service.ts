/**
 * Serviço de alertas — delega ao sistema Alertas Automáticos.
 * @module intelligence/services/alerts
 */

import type { IntelligencePeriod } from '../types.js'
import type { SmartAlert, SmartAlertsReport } from '../types/smartAlerts.types.js'
import {
  getSmartAlerts,
  getSmartAlertsReport,
  refreshSmartAlerts,
} from './smartAlerts.service.js'

export async function getIntelligenceAlerts(
  period: IntelligencePeriod,
  limit?: number,
): Promise<SmartAlert[]> {
  return getSmartAlerts(period, limit)
}

export async function getIntelligenceAlertsReport(
  period: IntelligencePeriod,
): Promise<SmartAlertsReport> {
  return getSmartAlertsReport(period)
}

export async function refreshIntelligenceAlerts(
  period: IntelligencePeriod,
): Promise<SmartAlertsReport> {
  return refreshSmartAlerts(period)
}

export type { SmartAlert, SmartAlertsReport } from '../types/smartAlerts.types.js'
