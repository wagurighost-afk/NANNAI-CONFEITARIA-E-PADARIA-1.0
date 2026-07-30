import type { ProductionFormSchema } from '@/features/production/schemas/production.schema'
import type { CreateProductionInput } from '@/features/production/types/production.types'

export function toCreateProductionInput(values: ProductionFormSchema): CreateProductionInput {
  return {
    date: values.date,
    shift: values.shift,
    sector: values.sector,
    employeeId: values.employeeId,
    notes: values.notes,
    items: values.items.map((item) => ({
      name: item.name,
      status: item.status,
      ...(item.recipeId ? { recipeId: item.recipeId } : {}),
    })),
  }
}
