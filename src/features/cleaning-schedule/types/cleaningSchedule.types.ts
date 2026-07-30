import type { EmployeeShift } from '@/features/employees/types/employee.types'

export const WEEK_DAYS = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
] as const

export type WeekDay = (typeof WEEK_DAYS)[number]

export interface CleaningAssignment {
  shift: EmployeeShift
  employeeIds: string[]
  employeeNames: string[]
}

export interface CleaningDaySchedule {
  weekDay: WeekDay
  assignments: CleaningAssignment[]
}

export interface CleaningSchedule {
  id: string
  days: CleaningDaySchedule[]
  updatedAt: string
}

export type UpdateCleaningDayInput = {
  weekDay: WeekDay
  assignments: CleaningAssignment[]
}
