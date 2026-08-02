/**
 * Tipos do sistema de Alertas Automáticos (frontend).
 */

import type { IntelligencePeriod } from '@/features/intelligence/types/intelligence.types'

export type SmartAlertPriority = 'critica' | 'alta' | 'media' | 'baixa'

export type SmartAlertType =
  | 'estoque_baixo'
  | 'desperdicio_elevado'
  | 'producao_atrasada'
  | 'ingrediente_critico'
  | 'funcionario_sobrecarregado'

export type SmartAlertDomain = 'inventory' | 'waste' | 'production' | 'employees'

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

export const SMART_ALERT_PRIORITY_LABELS: Record<SmartAlertPriority, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

export const SMART_ALERT_TYPE_LABELS: Record<SmartAlertType, string> = {
  estoque_baixo: 'Estoque baixo',
  desperdicio_elevado: 'Desperdício elevado',
  producao_atrasada: 'Produção atrasada',
  ingrediente_critico: 'Ingrediente crítico',
  funcionario_sobrecarregado: 'Funcionário sobrecarregado',
}
