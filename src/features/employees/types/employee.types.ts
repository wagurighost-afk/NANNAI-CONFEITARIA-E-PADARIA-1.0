export const EMPLOYEE_SECTORS = ['Operações', 'Administração', 'Confeitaria', 'Padaria'] as const

export type EmployeeSector = (typeof EMPLOYEE_SECTORS)[number]

/** Setores usados em produção e escalas operacionais (confeitaria/padaria). */
export const PRODUCTION_SECTORS = ['Confeitaria', 'Padaria'] as const

export type ProductionSector = (typeof PRODUCTION_SECTORS)[number]

export const EMPLOYEE_POSITIONS = [
  'Diretor de Operação',
  'Gerente Geral',
  'Chef Executivo',
  'Chef de Confeitaria',
  'Confeiteiro',
  'Auxiliar de Confeitaria',
  'Padeiro',
  'Auxiliar de Padaria',
] as const

export type EmployeePosition = (typeof EMPLOYEE_POSITIONS)[number]

export const EMPLOYEE_STATUSES = ['Ativo', 'Folga', 'Férias', 'Afastado'] as const

export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number]

export const EMPLOYEE_SHIFTS = ['Manhã', 'Tarde', 'Madrugada', 'Integral'] as const

export type EmployeeShift = (typeof EMPLOYEE_SHIFTS)[number]

export interface EmployeeProductionItem {
  id: string
  name: string
  target: string
}

export interface EmployeeChecklistItem {
  id: string
  title: string
  status: 'Pendente' | 'Concluído'
}

export interface EmployeeHistoryItem {
  id: string
  date: string
  title: string
  description: string
}

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  photoUrl?: string
  position: EmployeePosition
  sector: EmployeeSector
  shift: EmployeeShift
  status: EmployeeStatus
  admissionDate: string
  notes?: string
  productions: EmployeeProductionItem[]
  checklists: EmployeeChecklistItem[]
  history: EmployeeHistoryItem[]
}

export interface EmployeeFilters {
  search: string
  sector: EmployeeSector | 'all'
  position: EmployeePosition | 'all'
  status: EmployeeStatus | 'all'
}

export type EmployeeViewMode = 'table' | 'cards'

export interface EmployeeKpis {
  total: number
  active: number
  onVacation: number
  management: number
  confectionery: number
  bakery: number
}

export type EmployeeFormInput = {
  name: string
  email: string
  phone: string
  photoUrl: string
  position: EmployeePosition
  sector: EmployeeSector
  shift: EmployeeShift
  status: EmployeeStatus
  admissionDate: string
  notes: string
}

export type EmployeePhotoInput = {
  photoFile?: File | null
  removePhoto?: boolean
}

export type CreateEmployeeInput = EmployeeFormInput & EmployeePhotoInput
export type UpdateEmployeeInput = EmployeeFormInput & EmployeePhotoInput
