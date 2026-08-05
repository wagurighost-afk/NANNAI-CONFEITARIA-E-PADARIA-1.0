export type WasteBuffetType = 'cafe' | 'cha' | 'jantar'
export type WastePhase = 'entrada' | 'reposicao' | 'finalizacao'
export type WasteSector = 'Confeitaria' | 'Padaria'

export type WasteConferenceStatus =
  | 'aguardando_conferencia'
  | 'conferido'
  | 'necessita_revisao'

export interface WasteControlProduct {
  id: string
  name: string
  unit: string
  unitPrice: number
  buffets: WasteBuffetType[]
  sector: WasteSector
}

export interface WasteLineItem {
  productId: string
  productName: string
  sector: WasteSector
  units: number
  wasteKg: number
  unitPrice: number
  total: number
}

export interface WastePhaseRecord {
  items: WasteLineItem[]
  wasteKgTotal: number
  phaseTotal: number
}

export interface WasteAssignmentInfo {
  responsibleEmployeeId: string
  responsibleEmployeeName: string
  responsiblePosition: string
  responsibleShift: string
  assignedAt: string
  assignedById: string
  assignedByName: string
  sector: string
}

export interface WasteClosingInfo {
  closedAt: string
  closedById: string
  closedByName: string
}

export interface WasteConferenceInfo {
  status: WasteConferenceStatus
  checkedById: string | null
  checkedByName: string | null
  checkedAt: string | null
  notes: string
}

export interface WasteControlDay {
  id: string
  date: string
  buffet: WasteBuffetType
  pax: number
  monthlyGoalKg: number
  dessertsQty: number
  phases: Record<WastePhase, WastePhaseRecord>
  wasteKgTotal: number
  dayTotal: number
  updatedAt: string
  assignment?: WasteAssignmentInfo | null
  closing?: WasteClosingInfo | null
  conference?: WasteConferenceInfo | null
}

export type WastePhaseItemInput = {
  productId: string
  units: number
  wasteKg: number
}

export interface SaveWasteControlDayInput {
  date: string
  buffet: WasteBuffetType
  pax: number
  monthlyGoalKg: number
  dessertsQty?: number
  phases: Record<WastePhase, WastePhaseItemInput[]>
  finalize?: boolean
}

export interface AssignWasteResponsibleInput {
  date: string
  buffet: WasteBuffetType
  responsibleEmployeeId: string
  responsibleEmployeeName: string
  responsiblePosition: string
  responsibleShift: string
  sector: string
}

export interface ConferenceWasteDayInput {
  date: string
  buffet: WasteBuffetType
  status: WasteConferenceStatus
  notes?: string
}

export interface WasteControlMonthlySummary {
  year: number
  month: number
  days: Array<{
    date: string
    dayNumber: number
    buffet: WasteBuffetType
    wasteKgTotal: number
    dayTotal: number
    pax: number
  }>
  buffetTotals: Record<WasteBuffetType, number>
  sectorTotals: Record<WasteSector, number>
  phaseTotals: Record<WastePhase, number>
  monthTotal: number
  monthWasteKg: number
}

export type WastePhaseDraft = Record<string, { units: number; wasteKg: number }>
