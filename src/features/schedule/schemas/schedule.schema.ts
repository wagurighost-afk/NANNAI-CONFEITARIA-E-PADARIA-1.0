import { z } from 'zod'
import {
  EMPLOYEE_SECTORS,
  EMPLOYEE_SHIFTS,
  EMPLOYEE_STATUSES,
} from '@/features/employees/types/employee.types'

export const scheduleFormSchema = z.object({
  employeeId: z.string().min(1, 'Selecione o colaborador.'),
  sector: z.enum(EMPLOYEE_SECTORS),
  shift: z.enum(EMPLOYEE_SHIFTS),
  status: z.enum(EMPLOYEE_STATUSES),
  notes: z.string().trim(),
})

export type ScheduleFormSchema = z.infer<typeof scheduleFormSchema>
