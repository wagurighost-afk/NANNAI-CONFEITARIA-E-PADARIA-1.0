import { authService } from '@/core/auth/authService'
import { storage } from '@/core/storage'
import { LABEL_TEMPLATES } from '@/features/labels/constants/labelTemplates'
import type { LabelRepository } from '@/features/labels/repositories/LabelRepository'
import type {
  CreateLabelFromProductionInput,
  CreateLabelInput,
  LabelListQuery,
  LabelListResult,
  LabelRecord,
  LabelTemplateConfig,
  LabelTemplateId,
} from '@/features/labels/types/label.types'
import { buildQrPayload, resolveLabelFieldData } from '@/features/labels/utils/labelData'
import { buildLabelDraftFromProduction } from '@/features/labels/utils/buildLabelFromProduction'
import { productionService } from '@/features/production/services/production.service'
import { recipesService } from '@/features/recipes/services/recipes.service'

const STORAGE_KEY = 'nannai.labels.records'

function delay(ms = 180): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function loadStore(): LabelRecord[] {
  const raw = storage.get(STORAGE_KEY)
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw) as LabelRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveStore(records: LabelRecord[]): void {
  storage.set(STORAGE_KEY, JSON.stringify(records))
}

function matchesSearch(record: LabelRecord, search: string): boolean {
  const normalized = search.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  const haystack = [
    record.data.productName,
    record.data.category,
    record.data.batchNumber,
    record.data.internalCode,
    record.data.responsible,
    record.printedByName,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalized)
}

async function getActor(): Promise<{ id: string; name: string }> {
  try {
    const user = await authService.me()
    return { id: user.id, name: user.name }
  } catch {
    return { id: 'mock-user', name: 'Equipe NANNAI' }
  }
}

async function createRecord(
  input: CreateLabelInput & { reprintOfId?: string },
): Promise<LabelRecord> {
  const actor = await getActor()
  const now = new Date()
  const nowIso = now.toISOString()
  const id = crypto.randomUUID()
  const data = resolveLabelFieldData(input.data, input.templateId, now)

  return {
    id,
    templateId: input.templateId,
    data,
    qrPayload: buildQrPayload(data, input.templateId, id),
    copies: Math.max(1, input.copies ?? 1),
    ...(input.productionId ? { productionId: input.productionId } : {}),
    ...(input.productionItemId ? { productionItemId: input.productionItemId } : {}),
    ...(input.recipeId ? { recipeId: input.recipeId } : {}),
    ...(input.reprintOfId ? { reprintOfId: input.reprintOfId } : {}),
    printedById: actor.id,
    printedByName: actor.name,
    printedAt: nowIso,
    createdAt: nowIso,
  }
}

export class MockLabelRepository implements LabelRepository {
  async listTemplates(): Promise<LabelTemplateConfig[]> {
    await delay()
    return [...LABEL_TEMPLATES]
  }

  async list(query: LabelListQuery = {}): Promise<LabelListResult> {
    await delay()
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 200)
    const offset = Math.max(query.offset ?? 0, 0)

    let items = loadStore()

    if (query.templateId) {
      items = items.filter((item) => item.templateId === query.templateId)
    }
    if (query.productionId) {
      items = items.filter((item) => item.productionId === query.productionId)
    }
    if (query.from) {
      items = items.filter((item) => item.data.productionDate >= query.from!)
    }
    if (query.to) {
      items = items.filter((item) => item.data.productionDate <= query.to!)
    }
    if (query.search) {
      items = items.filter((item) => matchesSearch(item, query.search!))
    }

    items.sort((a, b) => b.printedAt.localeCompare(a.printedAt))

    return {
      total: items.length,
      items: items.slice(offset, offset + limit),
    }
  }

  async getById(id: string): Promise<LabelRecord | null> {
    await delay()
    return loadStore().find((item) => item.id === id) ?? null
  }

  async create(input: CreateLabelInput): Promise<LabelRecord> {
    await delay()
    if (!LABEL_TEMPLATES.some((template) => template.id === input.templateId)) {
      throw new Error('Modelo de etiqueta inválido.')
    }

    const record = await createRecord(input)
    const store = loadStore()
    store.unshift(record)
    saveStore(store)
    return record
  }

  async createFromProduction(input: CreateLabelFromProductionInput): Promise<LabelRecord> {
    await delay()
    const production = await productionService.getById(input.productionId)
    if (!production) {
      throw new Error('Produção não encontrada.')
    }

    const item = production.items.find((entry) => entry.id === input.itemId)
    if (!item) {
      throw new Error('Item de produção não encontrado.')
    }
    if (item.status !== 'Concluído') {
      throw new Error('Somente itens concluídos podem gerar etiqueta.')
    }

    const actor = await getActor()
    const recipe = item.recipeId ? await recipesService.getById(item.recipeId) : null
    const draft = buildLabelDraftFromProduction({
      production,
      item,
      recipe,
      ...(input.templateId ? { templateId: input.templateId } : {}),
      ...(input.weight ? { weight: input.weight } : {}),
      responsibleName: actor.name,
    })

    return this.create({
      ...draft,
      copies: input.copies ?? 1,
    })
  }

  async reprint(id: string, copies: number): Promise<LabelRecord> {
    await delay()
    const source = await this.getById(id)
    if (!source) {
      throw new Error('Etiqueta não encontrada.')
    }

    const record = await createRecord({
      templateId: source.templateId as LabelTemplateId,
      data: source.data,
      copies: Math.max(1, copies),
      ...(source.productionId ? { productionId: source.productionId } : {}),
      ...(source.productionItemId ? { productionItemId: source.productionItemId } : {}),
      ...(source.recipeId ? { recipeId: source.recipeId } : {}),
      reprintOfId: source.id,
    })

    const store = loadStore()
    store.unshift(record)
    saveStore(store)
    return record
  }
}
