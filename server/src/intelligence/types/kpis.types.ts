/**
 * Tipos do relatório operacional de KPIs.
 * @module intelligence/types/kpis
 */

import type { WasteBuffetType } from '../../types.js'
import type { IntelligencePeriod } from '../types.js'

export interface ProductionKpis {
  completed: number
  pending: number
  delayed: number
  averageCompletionHours: number
  efficiencyPercent: number
  totalProductions: number
  totalItems: number
  completedItems: number
}

export interface WasteBuffetBreakdown {
  buffet: WasteBuffetType
  kg: number
  cost: number
}

export interface WasteProductBreakdown {
  productId: string
  productName: string
  kg: number
  cost: number
}

export interface WasteKpis {
  totalKg: number
  totalCost: number
  totalPax: number
  kgPerPax: number
  byBuffet: WasteBuffetBreakdown[]
  byProduct: WasteProductBreakdown[]
}

export interface BreadKpis {
  plannedUnits: number
  producedUnits: number
  difference: number
  daysWithRecords: number
}

export interface RecipeProductionRank {
  recipeId: string
  recipeName: string
  productionCount: number
}

export interface RecipeWasteRank {
  recipeId: string | null
  recipeName: string
  wasteKg: number
  wasteCost: number
  productName: string
}

export interface RecipeKpis {
  mostProduced: RecipeProductionRank | null
  leastProduced: RecipeProductionRank | null
  highestWaste: RecipeWasteRank | null
}

export interface EmployeeKpiRow {
  employeeId: string
  employeeName: string
  productivityPercent: number
  pending: number
  delayed: number
  completedItems: number
  totalItems: number
}

export interface EmployeeKpis {
  rows: EmployeeKpiRow[]
  averageProductivityPercent: number
  totalPending: number
  totalDelayed: number
}

export interface OperationalKpisReport {
  period: IntelligencePeriod
  generatedAt: string
  production: ProductionKpis
  waste: WasteKpis
  bread: BreadKpis
  recipes: RecipeKpis
  employees: EmployeeKpis
}
