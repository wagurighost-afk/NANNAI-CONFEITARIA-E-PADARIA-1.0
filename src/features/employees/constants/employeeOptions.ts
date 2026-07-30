import type { SelectOption } from '@/components/ui'
import {
  EMPLOYEE_POSITIONS,
  EMPLOYEE_SECTORS,
  EMPLOYEE_SHIFTS,
  EMPLOYEE_STATUSES,
  type EmployeePosition,
  type EmployeeSector,
  type EmployeeShift,
  type EmployeeStatus,
} from '@/features/employees/types/employee.types'

export const SECTOR_OPTIONS: SelectOption[] = EMPLOYEE_SECTORS.map((value) => ({
  value,
  label: value,
}))

export const POSITION_OPTIONS: SelectOption[] = EMPLOYEE_POSITIONS.map((value) => ({
  value,
  label: value,
}))

export const STATUS_OPTIONS: SelectOption[] = EMPLOYEE_STATUSES.map((value) => ({
  value,
  label: value,
}))

export const SHIFT_OPTIONS: SelectOption[] = EMPLOYEE_SHIFTS.map((value) => ({
  value,
  label: value,
}))

export const FILTER_SECTOR_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Todos os setores' },
  ...SECTOR_OPTIONS,
]

export const FILTER_POSITION_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Todos os cargos' },
  ...POSITION_OPTIONS,
]

export const FILTER_STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Todos os status' },
  ...STATUS_OPTIONS,
]

export const POSITION_LABELS: Record<EmployeePosition, string> = {
  'Chef de Confeitaria': 'Chef de Confeitaria',
  Confeiteiro: 'Confeiteiro',
  'Auxiliar de Confeitaria': 'Auxiliar de Confeitaria',
  Padeiro: 'Padeiro',
  'Auxiliar de Padaria': 'Auxiliar de Padaria',
}

export const SECTOR_LABELS: Record<EmployeeSector, string> = {
  Confeitaria: 'Confeitaria',
  Padaria: 'Padaria',
}

export const STATUS_LABELS: Record<EmployeeStatus, string> = {
  Ativo: 'Ativo',
  Folga: 'Folga',
  Férias: 'Férias',
  Afastado: 'Afastado',
}

export const SHIFT_LABELS: Record<EmployeeShift, string> = {
  Manhã: 'Manhã',
  Tarde: 'Tarde',
  Madrugada: 'Madrugada',
  Integral: 'Integral',
}
