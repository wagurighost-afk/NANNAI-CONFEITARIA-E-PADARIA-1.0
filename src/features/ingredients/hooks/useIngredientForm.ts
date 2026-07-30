import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ingredientFormSchema,
  type IngredientFormSchema,
} from '@/features/ingredients/schemas/ingredient.schema'
import type { Ingredient } from '@/features/ingredients/types/ingredient.types'

const EMPTY_VALUES: IngredientFormSchema = {
  name: '',
  description: '',
  category: 'Farinhas',
  unit: 'kg',
  supplier: '',
  averageCost: 0,
  currentStock: 0,
  minimumStock: 0,
  maximumStock: 0,
  expirationDate: '',
  lot: '',
  location: '',
  notes: '',
}

function toFormValues(ingredient: Ingredient | null): IngredientFormSchema {
  if (!ingredient) {
    return EMPTY_VALUES
  }

  return {
    name: ingredient.name,
    description: ingredient.description,
    category: ingredient.category,
    unit: ingredient.unit,
    supplier: ingredient.supplier,
    averageCost: ingredient.averageCost,
    currentStock: ingredient.currentStock,
    minimumStock: ingredient.minimumStock,
    maximumStock: ingredient.maximumStock,
    expirationDate: ingredient.expirationDate,
    lot: ingredient.lot,
    location: ingredient.location,
    notes: ingredient.notes,
  }
}

interface UseIngredientFormOptions {
  ingredient: Ingredient | null
  onSubmit: (values: IngredientFormSchema) => Promise<void>
}

export function useIngredientForm({ ingredient, onSubmit }: UseIngredientFormOptions) {
  const form = useForm<IngredientFormSchema>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: toFormValues(ingredient),
  })

  useEffect(() => {
    form.reset(toFormValues(ingredient))
  }, [ingredient, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return {
    form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
  }
}
