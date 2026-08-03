import type { ExecutiveDateRange, ExecutivePeriodPreset } from './period.js'

export type { ExecutiveDateRange, ExecutivePeriodPreset }

export type ExecutiveStatusTone = 'ok' | 'warning' | 'danger' | 'neutral'

export type ExecutiveAlertPriority = 'critico' | 'alto' | 'medio' | 'baixo'

export interface ExecutiveMetric {
  label: string
  value: number | string | null
  unit?: string
  tone?: ExecutiveStatusTone
  available: boolean
  note?: string
}

export interface ExecutiveSummary {
  totalProductions: number
  totalPax: number
  wasteKg: number
  wasteCost: number
  cmvTargetPercent: number
  cmvCurrentPercent: number | null
  efficiencyPercent: number
  activeEmployees: number
}

export interface ExecutiveOccupancy {
  available: boolean
  note: string
  pax: number
  uhOccupied: number | null
  checkIns: number | null
  checkOuts: number | null
  adults: number | null
  children: number | null
}

export interface ExecutiveProductionDayPoint {
  date: string
  planned: number
  completed: number
  pending: number
  delayed: number
}

export interface ExecutiveProduction {
  planned: number
  completed: number
  pending: number
  delayed: number
  efficiencyPercent: number
  dailyChart: ExecutiveProductionDayPoint[]
}

export interface ExecutiveBread {
  plannedUnits: number
  producedUnits: number
  difference: number
  excess: number
  shortage: number
  daysWithRecords: number
}

export interface ExecutiveWasteChartPoint {
  key: string
  label: string
  kg: number
  cost: number
}

export interface ExecutiveWaste {
  kg: number
  cost: number
  topProduct: { productId: string; productName: string; kg: number; cost: number } | null
  topBuffet: { buffet: string; label: string; kg: number; cost: number } | null
  charts: {
    day: ExecutiveWasteChartPoint[]
    week: ExecutiveWasteChartPoint[]
    month: ExecutiveWasteChartPoint[]
  }
}

export interface ExecutiveCosts {
  cmvAvailable: boolean
  cmvTargetPercent: number
  cmvCurrentPercent: number | null
  cmvDifferencePercent: number | null
  dayWasteCost: number
  periodWasteCost: number
  monthWasteCost: number
  note: string
}

export interface ExecutiveTeam {
  present: number
  absent: number
  onVacation: number
  averageProductivityPercent: number
  source: 'schedule' | 'seed-fallback'
  note?: string
}

export interface ExecutiveAuditItem {
  id: string
  at: string
  action: string
  summary: string
  actorName: string
  entityType: string
}

export interface ExecutiveAudit {
  lastAudit: ExecutiveAuditItem | null
  scoreAvailable: boolean
  score: number | null
  history: ExecutiveAuditItem[]
  pendingCount: number
  note: string
}

export interface ExecutiveInventory {
  available: boolean
  criticalItems: number | null
  belowMinimum: number | null
  expiringSoon: number | null
  note: string
}

export interface ExecutiveLabels {
  issuedToday: number
  issuedInPeriod: number
  pendingAvailable: boolean
  pending: number | null
  lastPrintedAt: string | null
  lastProductName: string | null
}

export interface ExecutiveAlert {
  id: string
  priority: ExecutiveAlertPriority
  title: string
  description: string
  owner: string
  at: string
  tone: ExecutiveStatusTone
}

export interface ExecutivePanelReport {
  generatedAt: string
  range: ExecutiveDateRange
  summary: ExecutiveSummary
  occupancy: ExecutiveOccupancy
  production: ExecutiveProduction
  bread: ExecutiveBread
  waste: ExecutiveWaste
  costs: ExecutiveCosts
  team: ExecutiveTeam
  audit: ExecutiveAudit
  inventory: ExecutiveInventory
  labels: ExecutiveLabels
  alerts: ExecutiveAlert[]
}
