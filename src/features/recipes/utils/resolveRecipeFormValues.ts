import {
  recipeFormBaseSchema,
  recipeManualFormSchema,
  type RecipeFormBaseSchema,
} from '@/features/recipes/schemas/recipe.schema'
import type { RecipeFormInput } from '@/features/recipes/types/recipe.types'
import { validateRecipeFile } from '@/features/recipes/utils/validateRecipeFile'

export type RecipeFormValidationResult =
  | { success: true; data: RecipeFormInput }
  | { success: false; error: string; field?: keyof RecipeFormBaseSchema }

export function resolveRecipeFormValues(
  values: RecipeFormBaseSchema,
  attachment: File | null,
): RecipeFormValidationResult {
  if (attachment) {
    const fileError = validateRecipeFile(attachment)
    if (fileError) {
      return { success: false, error: fileError }
    }

    const base = recipeFormBaseSchema.safeParse(values)
    if (!base.success) {
      return {
        success: false,
        error: base.error.issues[0]?.message ?? 'Dados inválidos.',
      }
    }

    const validIngredients = values.ingredients.filter((item) => item.name.trim().length > 0)

    return {
      success: true,
      data: {
        name: values.name.trim(),
        category: values.category,
        ingredients:
          validIngredients.length > 0
            ? validIngredients.map((item) => ({
                name: item.name.trim(),
                quantity: item.quantity,
                unit: item.unit.trim() || '-',
                ...(item.ingredientId ? { ingredientId: item.ingredientId } : {}),
              }))
            : [{ name: 'Ver documento anexo', quantity: 0, unit: '-' }],
        preparationMethod:
          values.preparationMethod.trim() || 'Consulte o documento anexo da ficha técnica.',
        notes: values.notes.trim(),
        prepTimeMinutes: values.prepTimeMinutes > 0 ? values.prepTimeMinutes : 1,
        ...(values.ovenTimeMinutes > 0 ? { ovenTimeMinutes: values.ovenTimeMinutes } : {}),
        yield: values.yield.trim() || 'Conforme documento',
        finalWeight: values.finalWeight.trim(),
        photoUrl: values.photoUrl.trim(),
        temperature: values.temperature.trim(),
        chef: values.chef.trim(),
        relatedPopIds: values.relatedPopIds,
        status: values.status,
      },
    }
  }

  const parsed = recipeManualFormSchema.safeParse(values)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const field = issue?.path[0]
    return {
      success: false,
      error: issue?.message ?? 'Dados inválidos.',
      ...(typeof field === 'string' ? { field: field as keyof RecipeFormBaseSchema } : {}),
    }
  }

  return {
    success: true,
    data: {
      name: parsed.data.name,
      category: parsed.data.category,
      ingredients: parsed.data.ingredients.map((item) => ({
        name: item.name.trim(),
        quantity: item.quantity,
        unit: item.unit.trim(),
        ...(item.ingredientId ? { ingredientId: item.ingredientId } : {}),
      })),
      preparationMethod: parsed.data.preparationMethod.trim(),
      notes: parsed.data.notes.trim(),
      prepTimeMinutes: parsed.data.prepTimeMinutes,
      ...(parsed.data.ovenTimeMinutes > 0 ? { ovenTimeMinutes: parsed.data.ovenTimeMinutes } : {}),
      yield: parsed.data.yield.trim(),
      finalWeight: parsed.data.finalWeight.trim(),
      photoUrl: parsed.data.photoUrl.trim(),
      temperature: parsed.data.temperature.trim(),
      chef: parsed.data.chef.trim(),
      relatedPopIds: parsed.data.relatedPopIds,
      status: parsed.data.status,
    },
  }
}
