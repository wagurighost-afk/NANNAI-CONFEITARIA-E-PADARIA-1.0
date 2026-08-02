export type WasteBuffetType = 'cha' | 'jantar'
export type WastePhase = 'entrada' | 'reposicao' | 'finalizacao'
export type WasteSector = 'Confeitaria' | 'Padaria'

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
