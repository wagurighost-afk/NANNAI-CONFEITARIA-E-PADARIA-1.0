import { z } from 'zod'
import { RECIPE_CATEGORIES, RECIPE_STATUSES } from '@/features/recipes/types/recipe.types'

const ingredientSchema = z.object({
  ingredientId: z.string().optional(),
  name: z.string().trim(),
  quantity: z.number().min(0, 'Quantidade inválida.'),
  unit: z.string().trim(),
})

/** Schema base — validação completa no submit conforme presença de anexo. */
export const recipeFormBaseSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da receita.'),
  category: z.enum(RECIPE_CATEGORIES),
  ingredients: z.array(ingredientSchema),
  preparationMethod: z.string().trim(),
  notes: z.string().trim(),
  prepTimeMinutes: z.number().min(0, 'Informe o tempo de preparo.'),
  ovenTimeMinutes: z.number().min(0),
  yield: z.string().trim(),
  finalWeight: z.string().trim(),
  photoUrl: z.string().trim(),
  temperature: z.string().trim(),
  chef: z.string().trim(),
  relatedPopIds: z.array(z.string()),
  status: z.enum(RECIPE_STATUSES),
})

export type RecipeFormBaseSchema = z.infer<typeof recipeFormBaseSchema>

/** Cadastro manual completo (sem documento anexo). */
export const recipeManualFormSchema = recipeFormBaseSchema
  .extend({
    prepTimeMinutes: z.number().min(1, 'Informe o tempo de preparo.'),
  })
  .refine((data) => data.preparationMethod.trim().length >= 10, {
    message: 'Descreva o modo de preparo.',
    path: ['preparationMethod'],
  })
  .refine((data) => data.ingredients.some((item) => item.name.trim().length > 0), {
    message: 'Adicione ao menos um ingrediente.',
    path: ['ingredients'],
  })
  .refine((data) => data.yield.trim().length >= 1, {
    message: 'Informe o rendimento.',
    path: ['yield'],
  })

export type RecipeFormSchema = z.infer<typeof recipeManualFormSchema>
