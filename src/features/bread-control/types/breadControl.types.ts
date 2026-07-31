export interface BreadControlProduct {
  id: string
  section: string
  name: string
  unitPrice: number
}

export interface BreadControlLineItem {
  productId: string
  productName: string
  section: string
  units: number
  unitPrice: number
  total: number
}

export interface BreadControlDay {
  id: string
  date: string
  pax: number
  items: BreadControlLineItem[]
  sectionTotals: Record<string, number>
  dayTotal: number
  updatedAt: string
}

export interface SaveBreadControlDayInput {
  date: string
  pax: number
  items: Array<{ productId: string; units: number }>
}

export interface BreadControlMonthlySummary {
  year: number
  month: number
  days: Array<{
    date: string
    dayNumber: number
    sectionTotals: Record<string, number>
    dayTotal: number
    pax: number
  }>
  sectionTotals: Record<string, number>
  monthTotal: number
}

export interface BreadControlCatalog {
  products: BreadControlProduct[]
  sections: string[]
}
