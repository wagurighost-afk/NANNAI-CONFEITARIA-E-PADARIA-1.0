/**
 * Tipos do sistema de Alertas Automáticos.
 * @module intelligence/types/smartAlerts
 */

import type { IntelligencePeriod } from '../types.js'

export type SmartAlertPriority = 'critica' | 'alta' | 'media' | 'baixa'

export type SmartAlertType =
  | 'estoque_baixo'
  | 'desperdicio_elevado'
  | 'producao_atrasada'
  | 'ingrediente_critico'
  | 'funcionario_sobrecarregado'

export type SmartAlertDomain =
  | 'inventory'
  | 'waste'
  | 'production'
  | 'employees'

export interface SmartAlertEvidence {
  label: string
  value: string | number
}

export interface SmartAlert {
  id: string
  type: SmartAlertType
  priority: SmartAlertPriority
  title: string
  description: string
  reason: string
  domain: SmartAlertDomain
  period: IntelligencePeriod
  createdAt: string
  evidence: SmartAlertEvidence[]
}

export interface SmartAlertsReport {
  period: IntelligencePeriod
  generatedAt: string
  alerts: SmartAlert[]
  summary: Record<SmartAlertPriority, number>
}
