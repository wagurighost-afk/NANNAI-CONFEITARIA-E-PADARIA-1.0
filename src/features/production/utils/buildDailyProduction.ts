import type { EmployeeSector, EmployeeShift } from '@/features/employees/types/employee.types'
import { getAppDayStartIso, getAppNowIso } from '@/core/constants/appDate'
import {
  ACTIVE_PRODUCTION_IDS,
  SKIPPED_PRODUCTION_EMPLOYEE_IDS,
} from '@/features/production/constants/activeProduction.constants'
import {
  PRODUCTION_DIVISION,
  type ProductionDivisionEntry,
} from '@/features/production/data/productionDivision.data'
import type { ProductionDay, ProductionItem } from '@/features/production/types/production.types'
import { withComputedProgress } from '@/features/production/utils/computeProductionKpis'

export function buildProductionItems(
  entry: ProductionDivisionEntry,
  existingItems?: ProductionItem[],
): ProductionItem[] {
  return entry.products.map((name, index) => {
    const existingItem = existingItems?.[index]
    return {
      id: existingItem?.id ?? `pi-${crypto.randomUUID()}`,
      name,
      status: 'Pendente',
      order: index + 1,
      ...(existingItem?.recipeId ? { recipeId: existingItem.recipeId } : {}),
    }
  })
}

export function buildDailyProduction(
  entry: ProductionDivisionEntry,
  productionId: string,
  productionCode: string,
  date: string,
  existing?: ProductionDay,
): ProductionDay {
  const timestamp = existing?.date === date ? existing.updatedAt : getAppDayStartIso()
  const now = getAppNowIso()

  const base: ProductionDay = {
    id: productionId,
    productionCode,
    date,
    shift: entry.shift as EmployeeShift,
    sector: entry.sector as EmployeeSector,
    employeeId: entry.employeeId,
    employeeName: entry.employeeName,
    items: buildProductionItems(entry, existing?.items),
    progress: 0,
    comments: [],
    notes: entry.notes ?? 'Trabalhar com antecedência. Sinalizar requisição de produtos.',
    createdAt: existing?.date === date ? existing.createdAt : timestamp,
    updatedAt: now,
  }

  return withComputedProgress(base)
}

export function buildAllDailyProductions(date: string): ProductionDay[] {
  return PRODUCTION_DIVISION.map((entry) => {
    if (SKIPPED_PRODUCTION_EMPLOYEE_IDS.has(entry.employeeId)) {
      return null
    }

    const meta = ACTIVE_PRODUCTION_IDS[entry.employeeId]
    if (!meta) {
      return null
    }

    return buildDailyProduction(entry, meta.id, meta.code, date)
  }).filter((production): production is ProductionDay => production !== null)
}
