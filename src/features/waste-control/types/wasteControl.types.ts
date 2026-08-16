export type WasteBuffetType = 'cafe' | 'cha' | 'jantar'
export type WastePhase = 'entrada' | 'reposicao' | 'finalizacao'
export type WasteSector = 'Confeitaria' | 'Padaria'
export type WasteControlSector = 'CONFEITARIA' | 'PADARIA'
export type WasteDayStatus = 'OPEN' | 'FINALIZED'
export type WasteProductApplicability = WasteSector | 'Ambos'

export type WasteConferenceStatus =
  | 'aguardando_conferencia'
  | 'conferido'
  | 'necessita_revisao'

export type WasteProductOrigin = 'Cadastro Mestre' | 'Manual'

export interface WasteControlProduct {
  id: string
  name: string
  unit: string
  unitPrice: number
  buffets: WasteBuffetType[]
  sector: WasteSector
  applicability?: WasteProductApplicability
  /** ID no Cadastro de Produtos, quando vinculado por nome. */
  catalogProductId?: string | null
  /** true quando o custo veio do Cadastro de Produtos. */
  costFromCatalog?: boolean
  /** Origem no Cadastro de Produtos (mestre ou manual). */
  origin?: WasteProductOrigin | null
}

export interface WasteLineItem {
  productId: string
  productName: string
  sector: WasteSector
  units: number
  wasteKg: number
  unitPrice: number
  total: number
  catalogProductId?: string | null
}

export interface WastePhaseRecord {
  items: WasteLineItem[]
  wasteKgTotal: number
  phaseTotal: number
}

export interface WasteMealRecord {
  pax: number
  dessertsQty: number
  phases: Record<WastePhase, WastePhaseRecord>
  wasteKgTotal: number
  dayTotal: number
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

export interface WasteActorSnapshot {
  id: string
  name: string
}

export interface WasteReopenRecord {
  reopenedAt: string
  reopenedById: string
  reopenedByName: string
  reason: string
  previousFinalizedAt: string | null
  previousFinalizedById: string | null
  previousFinalizedByName: string | null
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
  operationalDate?: string
  sector?: WasteControlSector | null
  status?: WasteDayStatus
  buffet: WasteBuffetType
  pax: number
  /** Meta mensal de desperdício em reais (R$). */
  monthlyGoalReais: number
  dessertsQty: number
  phases: Record<WastePhase, WastePhaseRecord>
  meals?: Partial<Record<WasteBuffetType, WasteMealRecord>>
  wasteKgTotal: number
  dayTotal: number
  responsibleEmployeeId?: string | null
  responsibleEmployeeName?: string | null
  openedAt?: string
  openedBy?: WasteActorSnapshot | null
  finalizedAt?: string | null
  finalizedBy?: WasteActorSnapshot | null
  createdAt?: string
  updatedAt: string
  assignment?: WasteAssignmentInfo | null
  closing?: WasteClosingInfo | null
  conference?: WasteConferenceInfo | null
  reopenHistory?: WasteReopenRecord[]
}

export type WastePhaseItemInput = {
  productId: string
  units: number
  wasteKg: number
}

export interface SaveWasteControlDayInput {
  date: string
  sector: WasteControlSector
  buffet: WasteBuffetType
  pax: number
  /** Meta mensal de desperdício em reais (R$). */
  monthlyGoalReais: number
  dessertsQty?: number
  phases: Record<WastePhase, WastePhaseItemInput[]>
  finalize?: boolean
}

export interface AssignWasteResponsibleInput {
  date: string
  sector: WasteControlSector
  buffet?: WasteBuffetType
  responsibleEmployeeId: string
  responsibleEmployeeName: string
  responsiblePosition: string
  responsibleShift: string
}

export interface ConferenceWasteDayInput {
  date: string
  sector: WasteControlSector
  buffet?: WasteBuffetType
  status: WasteConferenceStatus
  notes?: string
}

export interface ReopenWasteDayInput {
  date: string
  sector: WasteControlSector
  reason: string
}

export interface WasteControlMonthlySummary {
  year: number
  month: number
  days: Array<{
    date: string
    dayNumber: number
    buffet: WasteBuffetType
    sector: WasteControlSector | null
    wasteKgTotal: number
    dayTotal: number
    pax: number
  }>
  buffetTotals: Record<WasteBuffetType, number>
  sectorTotals: Record<WasteSector, number>
  controlSectorTotals: Record<WasteControlSector, number> & { LEGACY: number }
  phaseTotals: Record<WastePhase, number>
  monthTotal: number
  monthWasteKg: number
}

export interface WasteControlDayOverview {
  operationalDate: string
  confeitaria: {
    id: string
    status: WasteDayStatus
    dayTotal: number
    wasteKgTotal: number
  } | null
  padaria: {
    id: string
    status: WasteDayStatus
    dayTotal: number
    wasteKgTotal: number
  } | null
  consolidatedTotal: number
  legacyTotal: number
}

export type WastePhaseDraft = Record<string, { units: number; wasteKg: number }>
