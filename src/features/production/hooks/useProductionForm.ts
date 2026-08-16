import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  productionFormSchema,
  type ProductionFormSchema,
} from '@/features/production/schemas/production.schema'
import type { ProductionDay } from '@/features/production/types/production.types'
import { getAppTodayIso } from '@/core/constants/appDate'

const EMPTY_VALUES: ProductionFormSchema = {
  date: getAppTodayIso(),
  shift: 'Manhã',
  sector: 'Confeitaria',
  employeeId: '',
  items: [{ name: '', status: 'Pendente' }],
  notes: '',
}

function toFormValues(production: ProductionDay | null): ProductionFormSchema {
  if (!production) {
    return EMPTY_VALUES
  }

  return {
    date: production.date,
    shift: production.shift,
    sector: production.sector,
    employeeId: production.employeeId,
    items: production.items
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        name: item.name,
        status: item.status,
        ...(item.recipeId ? { recipeId: item.recipeId } : {}),
      })),
    notes: production.notes,
  }
}

interface UseProductionFormOptions {
  production: ProductionDay | null
  onSubmit: (values: ProductionFormSchema) => Promise<void>
}

export function useProductionForm({ production, onSubmit }: UseProductionFormOptions) {
  const form = useForm<ProductionFormSchema>({
    resolver: zodResolver(productionFormSchema),
    defaultValues: toFormValues(production),
  })

  useEffect(() => {
    form.reset(toFormValues(production))
  }, [production, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return {
    form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
  }
}
