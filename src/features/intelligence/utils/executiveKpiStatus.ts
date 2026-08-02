/**
 * Avaliação de prioridade dos indicadores do Dashboard Executivo.
 * Baseada somente em KPIs reais — sem valores inventados.
 * @module intelligence/utils/executiveKpiStatus
 */

import type {
  EmployeeKpis,
  ProductionKpis,
  WasteKpis,
} from '@/features/intelligence/types/operationalKpis.types'
import type { SmartInsightPriority } from '@/features/intelligence/types/smartInsights.types'

export function getProductionPriority(production: ProductionKpis): SmartInsightPriority {
  if (production.totalProductions === 0 && production.totalItems === 0) {
    return 'baixo'
  }
  const delayedRate =
    production.totalProductions > 0 ? production.delayed / production.totalProductions : 0
  if (production.delayed >= 3 || delayedRate >= 0.3) {
    return 'critico'
  }
  if (production.delayed >= 1 || production.efficiencyPercent < 70) {
    return 'alto'
  }
  if (production.pending > 0 || production.efficiencyPercent < 85) {
    return 'medio'
  }
  return 'baixo'
}

export function getWastePriority(waste: WasteKpis): SmartInsightPriority {
  if (waste.totalKg <= 0) {
    return 'baixo'
  }
  if (waste.totalKg >= 50 || (waste.totalPax > 0 && waste.kgPerPax >= 0.5)) {
    return 'critico'
  }
  if (waste.totalKg >= 25 || (waste.totalPax > 0 && waste.kgPerPax >= 0.3)) {
    return 'alto'
  }
  return 'medio'
}

export function getPaxPriority(waste: WasteKpis): SmartInsightPriority {
  if (waste.totalPax <= 0) {
    return 'medio'
  }
  if (waste.kgPerPax >= 0.5) {
    return 'critico'
  }
  if (waste.kgPerPax >= 0.3) {
    return 'alto'
  }
  if (waste.kgPerPax > 0) {
    return 'medio'
  }
  return 'baixo'
}

export function getEfficiencyPriority(production: ProductionKpis): SmartInsightPriority {
  if (production.totalItems === 0) {
    return 'baixo'
  }
  if (production.efficiencyPercent < 50) {
    return 'critico'
  }
  if (production.efficiencyPercent < 70) {
    return 'alto'
  }
  if (production.efficiencyPercent < 85) {
    return 'medio'
  }
  return 'baixo'
}

export function getCostPriority(waste: WasteKpis): SmartInsightPriority {
  if (waste.totalCost <= 0) {
    return 'baixo'
  }
  if (waste.totalCost >= 1000) {
    return 'critico'
  }
  if (waste.totalCost >= 500) {
    return 'alto'
  }
  if (waste.totalCost >= 200) {
    return 'medio'
  }
  return 'baixo'
}

export function getPendingPriority(
  production: ProductionKpis,
  employees: EmployeeKpis,
): SmartInsightPriority {
  const total =
    production.pending + production.delayed + employees.totalPending + employees.totalDelayed

  if (production.delayed >= 3 || employees.totalDelayed >= 3) {
    return 'critico'
  }
  if (production.delayed >= 1 || employees.totalDelayed >= 1 || total >= 5) {
    return 'alto'
  }
  if (total > 0) {
    return 'medio'
  }
  return 'baixo'
}
