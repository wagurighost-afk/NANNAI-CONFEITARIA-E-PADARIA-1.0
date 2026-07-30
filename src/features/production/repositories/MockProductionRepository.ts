import { getAppNowIso } from '@/core/constants/appDate'
import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'
import { PRODUCTION_MOCK } from '@/features/production/mocks/production.mock'
import type { ProductionRepository } from '@/features/production/repositories/ProductionRepository'
import {
  loadPersistedProductions,
  persistProductions,
  storeCommentPhotoFile,
} from '@/features/production/storage/productionStorePersistence'
import { rolloverProductionsIfNeeded } from '@/features/production/utils/productionDailyRollover'
import type {
  AddShiftCommentInput,
  CreateProductionInput,
  DuplicateProductionInput,
  ProductionDay,
  ProductionFilters,
  ProductionItem,
  ReorderProductionItemsInput,
  ShiftComment,
  ShiftCommentPhoto,
  UpdateProductionInput,
  UpdateProductionItemStatusInput,
} from '@/features/production/types/production.types'
import { getNextProductionCode } from '@/features/production/utils/productionCode'
import { withComputedProgress } from '@/features/production/utils/computeProductionKpis'
import { logger } from '@/core/logger'

function delay(ms = 260): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

let store: ProductionDay[] = PRODUCTION_MOCK.map((production) => ({
  ...production,
  comments: (production.comments ?? []).map((comment) => ({
    ...comment,
    photos: comment.photos ?? [],
  })),
}))

let storeReady: Promise<void> = loadPersistedProductions()
  .then((productions) => {
    const rollover = rolloverProductionsIfNeeded(productions)
    store = rollover.store
    if (rollover.changed) {
      persistProductions(store)
    }
  })
  .catch(() => {
    const rollover = rolloverProductionsIfNeeded(
      PRODUCTION_MOCK.map((production) => ({
        ...production,
        comments: (production.comments ?? []).map((comment) => ({
          ...comment,
          photos: comment.photos ?? [],
        })),
      })),
    )
    store = rollover.store
    if (rollover.changed) {
      persistProductions(store)
    }
  })

async function ensureStore(): Promise<void> {
  await storeReady

  const rollover = rolloverProductionsIfNeeded(store)
  if (rollover.changed) {
    store = rollover.store
    saveStore()
  }
}

function saveStore(): void {
  persistProductions(store)
}

async function buildCommentPhotos(files: File[]): Promise<ShiftCommentPhoto[]> {
  const photos: ShiftCommentPhoto[] = []

  for (const file of files) {
    const id = `cphoto-${crypto.randomUUID()}`
    const fileUrl = await storeCommentPhotoFile(id, file)
    photos.push({
      id,
      fileName: file.name,
      mimeType: file.type || 'image/jpeg',
      fileUrl,
    })
  }

  return photos
}

function matchesFilters(production: ProductionDay, filters: ProductionFilters): boolean {
  const search = filters.search.trim().toLowerCase()

  if (filters.date && production.date !== filters.date) {
    return false
  }

  if (filters.shift !== 'all' && production.shift !== filters.shift) {
    return false
  }

  if (filters.sector !== 'all' && production.sector !== filters.sector) {
    return false
  }

  if (filters.employeeId !== 'all' && production.employeeId !== filters.employeeId) {
    return false
  }

  if (filters.status !== 'all') {
    const hasStatus = production.items.some((item) => item.status === filters.status)
    if (!hasStatus) {
      return false
    }
  }

  if (search) {
    const haystack =
      `${production.productionCode} ${production.employeeName} ${production.items.map((i) => i.name).join(' ')}`.toLowerCase()
    if (!haystack.includes(search)) {
      return false
    }
  }

  return true
}

function resolveEmployeeName(employeeId: string): string {
  return EMPLOYEES_MOCK.find((e) => e.id === employeeId)?.name ?? 'Colaborador'
}

function buildItems(
  inputs: CreateProductionInput['items'],
  existing?: ProductionItem[],
): ProductionItem[] {
  return inputs.map((input, index) => {
    const existingItem = existing?.[index]
    return {
      id: existingItem?.id ?? `pi-${crypto.randomUUID()}`,
      name: input.name.trim(),
      status: input.status,
      order: index + 1,
      ...(input.recipeId ? { recipeId: input.recipeId } : {}),
    }
  })
}

function toProduction(
  input: CreateProductionInput,
  id: string,
  productionCode: string,
  timestamps: { createdAt: string; updatedAt: string },
  existing?: ProductionDay,
): ProductionDay {
  const items = buildItems(input.items, existing?.items)
  const base: ProductionDay = {
    id,
    productionCode,
    date: input.date,
    shift: input.shift,
    sector: input.sector,
    employeeId: input.employeeId,
    employeeName: resolveEmployeeName(input.employeeId),
    items,
    progress: 0,
    comments: existing?.comments ?? [],
    notes: input.notes.trim(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }

  return withComputedProgress(base)
}

export class MockProductionRepository implements ProductionRepository {
  async list(filters?: ProductionFilters): Promise<ProductionDay[]> {
    await ensureStore()
    await delay()
    const activeFilters = filters ?? {
      search: '',
      date: '',
      shift: 'all',
      sector: 'all',
      employeeId: 'all',
      status: 'all',
    }

    return store
      .filter((item) => matchesFilters(item, activeFilters))
      .map(withComputedProgress)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  async getById(id: string): Promise<ProductionDay | null> {
    await ensureStore()
    await delay()
    const found = store.find((item) => item.id === id)
    return found ? withComputedProgress(found) : null
  }

  async create(input: CreateProductionInput): Promise<ProductionDay> {
    await ensureStore()
    await delay()
    const now = new Date().toISOString()
    const production = toProduction(
      input,
      `prd-${crypto.randomUUID()}`,
      getNextProductionCode(store.map((item) => item.productionCode)),
      { createdAt: now, updatedAt: now },
    )
    store = [production, ...store]
    saveStore()
    logger.info('Produção criada (mock).', { id: production.id })
    return production
  }

  async update(id: string, input: UpdateProductionInput): Promise<ProductionDay> {
    await ensureStore()
    await delay()
    const index = store.findIndex((item) => item.id === id)
    if (index === -1) {
      throw new Error('Produção não encontrada.')
    }

    const existing = store[index]
    if (!existing) {
      throw new Error('Produção não encontrada.')
    }

    const now = new Date().toISOString()
    const updated = toProduction(input, id, existing.productionCode, {
      createdAt: existing.createdAt,
      updatedAt: now,
    }, existing)

    store[index] = { ...updated, comments: existing.comments }
    saveStore()
    return withComputedProgress(store[index])
  }

  async remove(id: string): Promise<void> {
    await ensureStore()
    await delay()
    const before = store.length
    store = store.filter((item) => item.id !== id)
    if (store.length === before) {
      throw new Error('Produção não encontrada.')
    }
    saveStore()
    logger.info('Produção removida (mock).', { id })
  }

  async duplicate(input: DuplicateProductionInput): Promise<ProductionDay> {
    await ensureStore()
    await delay()
    const source = store.find((item) => item.id === input.sourceId)
    if (!source) {
      throw new Error('Produção de origem não encontrada.')
    }

    const now = new Date().toISOString()
    const duplicated = toProduction(
      {
        date: input.targetDate,
        shift: input.targetShift ?? source.shift,
        sector: source.sector,
        employeeId: input.targetEmployeeId ?? source.employeeId,
        items: source.items.map((item) => ({
          name: item.name,
          status: 'Pendente',
          ...(item.recipeId ? { recipeId: item.recipeId } : {}),
        })),
        notes: source.notes,
      },
      `prd-${crypto.randomUUID()}`,
      getNextProductionCode(store.map((item) => item.productionCode)),
      { createdAt: now, updatedAt: now },
    )

    store = [duplicated, ...store]
    saveStore()
    return duplicated
  }

  async reorderItems(input: ReorderProductionItemsInput): Promise<ProductionDay> {
    await ensureStore()
    await delay()
    const index = store.findIndex((item) => item.id === input.productionId)
    if (index === -1) {
      throw new Error('Produção não encontrada.')
    }

    const production = store[index]
    if (!production) {
      throw new Error('Produção não encontrada.')
    }

    const itemMap = new Map(production.items.map((item) => [item.id, item]))
    const reordered = input.itemIds
      .map((id, orderIndex) => {
        const found = itemMap.get(id)
        if (!found) {
          return null
        }
        return { ...found, order: orderIndex + 1 }
      })
      .filter((item): item is ProductionItem => item !== null)

    if (reordered.length !== production.items.length) {
      throw new Error('Ordem de itens inválida.')
    }

    const updated: ProductionDay = {
      ...production,
      items: reordered,
      updatedAt: new Date().toISOString(),
    }

    store[index] = withComputedProgress(updated)
    saveStore()
    return store[index]
  }

  async updateItemStatus(input: UpdateProductionItemStatusInput): Promise<ProductionDay> {
    await ensureStore()
    await delay()
    const index = store.findIndex((item) => item.id === input.productionId)
    if (index === -1) {
      throw new Error('Produção não encontrada.')
    }

    const production = store[index]
    if (!production) {
      throw new Error('Produção não encontrada.')
    }

    const items = production.items.map((item) =>
      item.id === input.itemId ? { ...item, status: input.status } : item,
    )

    store[index] = withComputedProgress({
      ...production,
      items,
      updatedAt: new Date().toISOString(),
    })

    saveStore()
    return store[index]
  }

  async addComment(input: AddShiftCommentInput): Promise<ProductionDay> {
    await ensureStore()
    await delay()
    const index = store.findIndex((item) => item.id === input.productionId)
    if (index === -1) {
      throw new Error('Produção não encontrada.')
    }

    const production = store[index]
    if (!production) {
      throw new Error('Produção não encontrada.')
    }

    const message = input.message.trim()
    const photos = await buildCommentPhotos(input.photos ?? [])

    if (!message && photos.length === 0) {
      throw new Error('Informe um comentário ou anexe ao menos uma foto.')
    }

    const comment: ShiftComment = {
      id: `cmt-${crypto.randomUUID()}`,
      authorId: input.authorId,
      authorName: input.authorName,
      message,
      photos,
      createdAt: getAppNowIso(),
    }

    store[index] = {
      ...production,
      comments: [comment, ...production.comments],
      updatedAt: new Date().toISOString(),
    }

    saveStore()
    return store[index]
  }
}
