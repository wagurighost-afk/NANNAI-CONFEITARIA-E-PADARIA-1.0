import { z } from 'zod'
import { EMPLOYEE_SHIFTS, PRODUCTION_SECTORS } from '@/features/employees/types/employee.types'
import { PRODUCTION_ITEM_STATUSES } from '@/features/production/types/production.types'

const productionItemSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do item.'),
  status: z.enum(PRODUCTION_ITEM_STATUSES),
  recipeId: z.string().optional(),
})

export const productionFormSchema = z.object({
  date: z.string().min(1, 'Informe a data.'),
  shift: z.enum(EMPLOYEE_SHIFTS),
  sector: z.enum(PRODUCTION_SECTORS),
  employeeId: z.string().min(1, 'Selecione o responsável.'),
  items: z.array(productionItemSchema).min(1, 'Adicione ao menos um item de produção.'),
  notes: z.string().trim(),
})

export type ProductionFormSchema = z.infer<typeof productionFormSchema>

export const duplicateProductionSchema = z.object({
  targetDate: z.string().min(1, 'Informe a data de destino.'),
  targetShift: z.enum(EMPLOYEE_SHIFTS).optional(),
  targetEmployeeId: z.string().optional(),
})

export type DuplicateProductionSchema = z.infer<typeof duplicateProductionSchema>

export const shiftCommentSchema = z
  .object({
    message: z.string().trim(),
    photoCount: z.number().int().min(0),
  })
  .refine((value) => value.message.length >= 2 || value.photoCount > 0, {
    message: 'Digite um comentário ou anexe ao menos uma foto.',
    path: ['message'],
  })

export type ShiftCommentSchema = z.infer<typeof shiftCommentSchema>
