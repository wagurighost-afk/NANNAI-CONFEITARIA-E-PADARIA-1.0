import { z } from 'zod'
import {
  INGREDIENT_CATEGORIES,
  INGREDIENT_UNITS,
} from '@/features/ingredients/types/ingredient.types'

export const ingredientFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe o nome do ingrediente.'),
    description: z.string().trim(),
    category: z.enum(INGREDIENT_CATEGORIES),
    unit: z.enum(INGREDIENT_UNITS),
    supplier: z.string().trim().min(2, 'Informe o fornecedor.'),
    averageCost: z.number().min(0, 'Custo médio inválido.'),
    currentStock: z.number().min(0, 'Estoque atual inválido.'),
    minimumStock: z.number().min(0, 'Estoque mínimo inválido.'),
    maximumStock: z.number().min(0, 'Estoque máximo inválido.'),
    expirationDate: z.string().min(1, 'Informe a data de validade.'),
    lot: z.string().trim().min(1, 'Informe o lote.'),
    location: z.string().trim().min(1, 'Informe a localização.'),
    notes: z.string().trim(),
  })
  .refine((data) => data.maximumStock >= data.minimumStock, {
    message: 'Estoque máximo deve ser maior ou igual ao mínimo.',
    path: ['maximumStock'],
  })

export type IngredientFormSchema = z.infer<typeof ingredientFormSchema>
