import type { EmployeePosition, EmployeeShift } from '@/features/employees/types/employee.types'

/** Contextos operacionais que pedem responsável. */
export type AssignmentSector =
  | 'confeitaria'
  | 'padaria'
  | 'cafe'
  | 'cha'
  | 'jantar'

/** Status de presença unificado (escala mensal + diária). */
export type AssignmentPresenceStatus =
  | 'present'
  | 'interval'
  | 'absent'
  | 'off'
  | 'vacation'
  | 'leave'

export interface AssignableEmployee {
  employeeId: string
  name: string
  position: EmployeePosition | string
  shift: string
  shiftCode?: string
  photoUrl?: string
  sectorLabel: string
  presence: AssignmentPresenceStatus
  selectable: boolean
  source: 'monthly' | 'daily' | 'both'
}

export interface ListAssignableInput {
  date: string
  sector: AssignmentSector
  /** Linhas da escala mensal do mês da data. */
  monthlyRows: Array<{
    employeeId: string | null
    employeeName: string
    position: string
    shift: string
    shiftCode: string
    dayStatus: 'work' | 'off' | 'vacation' | 'leave' | 'other' | null
  }>
  /** Escala diária / status da equipe. */
  dailyEntries: Array<{
    employeeId: string
    employeeName: string
    sector: string
    shift: EmployeeShift | string
    status: 'Ativo' | 'Folga' | 'Férias' | 'Afastado' | string
    notes?: string
  }>
  /** Catálogo de colaboradores (foto, cargo, setor). */
  employees: Array<{
    id: string
    name: string
    position: string
    sector: string
    shift: string
    status: string
    photoUrl?: string
  }>
}

export type WasteConferenceStatus =
  | 'aguardando_conferencia'
  | 'conferido'
  | 'necessita_revisao'

export interface WasteAssignmentRecord {
  responsibleEmployeeId: string
  responsibleEmployeeName: string
  responsiblePosition: string
  responsibleShift: string
  assignedAt: string
  assignedById: string
  assignedByName: string
  sector: AssignmentSector
}

export interface WasteClosingRecord {
  closedAt: string
  closedById: string
  closedByName: string
}

export interface WasteConferenceRecord {
  status: WasteConferenceStatus
  checkedById: string | null
  checkedByName: string | null
  checkedAt: string | null
  notes: string
}
