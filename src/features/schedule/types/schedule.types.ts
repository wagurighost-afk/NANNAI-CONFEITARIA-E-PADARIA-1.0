import type {
  EmployeeSector,
  EmployeeShift,
  EmployeeStatus,
} from '@/features/employees/types/employee.types'

export interface ScheduleEntry {
  id: string
  employeeId: string
  employeeName: string
  sector: EmployeeSector
  shift: EmployeeShift
  status: EmployeeStatus
  notes: string
  updatedAt: string
}

export interface ScheduleFilters {
  search: string
  sector: EmployeeSector | 'all'
  shift: EmployeeShift | 'all'
  status: EmployeeStatus | 'all'
}

export interface ScheduleKpis {
  total: number
  active: number
  onLeave: number
  onVacation: number
}

export type ScheduleFormInput = {
  employeeId: string
  sector: EmployeeSector
  shift: EmployeeShift
  status: EmployeeStatus
  notes: string
}

export type CreateScheduleInput = ScheduleFormInput
export type UpdateScheduleInput = ScheduleFormInput
