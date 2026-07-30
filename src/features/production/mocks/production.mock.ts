import type { ProductionDay, ProductionItemStatus } from '@/features/production/types/production.types'
import { appDateTimeAt, getAppTodayIso } from '@/core/constants/appDate'
import { ACTIVE_PRODUCTION_IDS } from '@/features/production/constants/activeProduction.constants'
import {
  PRODUCTION_DIVISION,
  type ProductionDivisionEntry,
} from '@/features/production/data/productionDivision.data'
import { buildDailyProduction } from '@/features/production/utils/buildDailyProduction'
import { computeProductionProgress } from '@/features/production/utils/computeProductionProgress'

interface ProductionSeedExtras {
  statuses?: Partial<Record<number, ProductionItemStatus>>
  comments?: ProductionDay['comments']
  skip?: boolean
}

function applySeedExtras(
  production: ProductionDay,
  extras: ProductionSeedExtras,
): ProductionDay {
  const items = production.items.map((item, index) => ({
    ...item,
    status: extras.statuses?.[index] ?? item.status,
  }))

  return {
    ...production,
    items,
    comments: extras.comments ?? production.comments,
    progress: computeProductionProgress(items),
  }
}

const PRODUCTION_EXTRAS: Record<string, ProductionSeedExtras> = {
  'emp-mauro': { statuses: { 0: 'Concluído', 3: 'Em andamento' } },
  'emp-larissa': { statuses: { 0: 'Concluído', 1: 'Em andamento' } },
  'emp-helena': {
    statuses: { 12: 'Em andamento' },
    comments: [
      {
        id: 'cmt-helena-001',
        authorId: 'emp-david',
        authorName: 'David Oliveira',
        message: 'Priorizar macarons até 14h.',
        photos: [],
        createdAt: appDateTimeAt(14, 0),
      },
    ],
  },
  'emp-hosana': {
    statuses: { 4: 'Concluído', 5: 'Em andamento', 7: 'Concluído' },
    comments: [
      {
        id: 'cmt-hosana-001',
        authorId: 'emp-hosana',
        authorName: 'Hosana da Conceição',
        message: 'Brownie finalizado às 08:30. Iniciando brigadeirão.',
        photos: [],
        createdAt: appDateTimeAt(8, 35),
      },
      {
        id: 'cmt-hosana-002',
        authorId: 'emp-hosana',
        authorName: 'Hosana da Conceição',
        message: 'Brigadeirão em finalização. Bancada higienizada.',
        photos: [],
        createdAt: appDateTimeAt(21, 6),
      },
    ],
  },
  'emp-adriana': { statuses: { 1: 'Em andamento' } },
  'emp-williamys': { statuses: { 0: 'Concluído', 1: 'Em andamento' } },
  'emp-david': { skip: true },
  'emp-elenilson': { skip: true },
}

function buildSeedProduction(
  entry: ProductionDivisionEntry,
  code: string,
  id: string,
  extras: ProductionSeedExtras = {},
): ProductionDay | null {
  if (extras.skip) {
    return null
  }

  const base = buildDailyProduction(entry, id, code, getAppTodayIso())
  return applySeedExtras(base, extras)
}

export const PRODUCTION_MOCK: ProductionDay[] = PRODUCTION_DIVISION.map((entry) => {
  const meta = ACTIVE_PRODUCTION_IDS[entry.employeeId]
  const extras = PRODUCTION_EXTRAS[entry.employeeId] ?? {}
  if (!meta) {
    return null
  }

  return buildSeedProduction(entry, meta.code, meta.id, extras)
}).filter((entry): entry is ProductionDay => entry !== null)
