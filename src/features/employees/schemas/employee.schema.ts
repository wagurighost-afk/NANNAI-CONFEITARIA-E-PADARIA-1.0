import { z } from 'zod'
import {
  EMPLOYEE_POSITIONS,
  EMPLOYEE_SECTORS,
  EMPLOYEE_SHIFTS,
  EMPLOYEE_STATUSES,
} from '@/features/employees/types/employee.types'
import { assertEmployeeEmailDomain } from '@/features/employees/utils/employeeEmail'

export const employeeFormSchema = z
  .object({
    name: z.string().trim().min(3, 'Informe o nome completo.'),
    email: z.email('Informe um e-mail válido.'),
    phone: z.string().trim().min(8, 'Informe um telefone válido.'),
    photoUrl: z.string().trim(),
    position: z.enum(EMPLOYEE_POSITIONS),
    sector: z.enum(EMPLOYEE_SECTORS),
    shift: z.enum(EMPLOYEE_SHIFTS),
    status: z.enum(EMPLOYEE_STATUSES),
    admissionDate: z.string().min(1, 'Informe a data de admissão.'),
    notes: z.string().trim(),
  })
  .refine((data) => assertEmployeeEmailDomain(data.email, data.position), {
    message: 'O domínio do e-mail não corresponde ao cargo (Chef → @nannai.com.br).',
    path: ['email'],
  })

export type EmployeeFormSchema = z.infer<typeof employeeFormSchema>
