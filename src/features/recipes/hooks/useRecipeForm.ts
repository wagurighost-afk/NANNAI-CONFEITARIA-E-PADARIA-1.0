import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  recipeFormBaseSchema,
  type RecipeFormBaseSchema,
} from '@/features/recipes/schemas/recipe.schema'
import type { Recipe } from '@/features/recipes/types/recipe.types'

const EMPTY: RecipeFormBaseSchema = {
  name: '',
  category: 'Doces',
  ingredients: [{ name: '', quantity: 0, unit: 'g' }],
  preparationMethod: '',
  notes: '',
  prepTimeMinutes: 30,
  yield: '',
  photoUrl: '',
  status: 'Ativa',
}

function toValues(recipe: Recipe | null): RecipeFormBaseSchema {
  if (!recipe) {
    return EMPTY
  }
  return {
    name: recipe.name,
    category: recipe.category,
    ingredients: recipe.ingredients,
    preparationMethod: recipe.preparationMethod,
    notes: recipe.notes,
    prepTimeMinutes: recipe.prepTimeMinutes,
    yield: recipe.yield,
    photoUrl: recipe.photoUrl ?? '',
    status: recipe.status,
  }
}

export function useRecipeForm({
  recipe,
  onSubmit,
}: {
  recipe: Recipe | null
  onSubmit: (values: RecipeFormBaseSchema) => Promise<void>
}) {
  const form = useForm<RecipeFormBaseSchema>({
    resolver: zodResolver(recipeFormBaseSchema),
    defaultValues: toValues(recipe),
  })

  useEffect(() => {
    form.reset(toValues(recipe))
  }, [recipe, form])

  return {
    form,
    handleSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
  }
}
