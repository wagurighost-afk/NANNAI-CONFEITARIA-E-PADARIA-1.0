import type { ProductionRepository } from '@/features/production/repositories/ProductionRepository'
import { usesCloudPersistence } from '@/core/persistence/cloudPersistence'
import { MockProductionRepository } from '@/features/production/repositories/MockProductionRepository'
import { ApiProductionRepository } from '@/features/production/repositories/ApiProductionRepository'
import type {
  AddShiftCommentInput,
  CreateProductionInput,
  DuplicateProductionInput,
  ProductionDay,
  ProductionFilters,
  ReorderProductionItemsInput,
  UpdateProductionInput,
  UpdateProductionItemStatusInput,
  UpdateProductionItemConferenceInput,
} from '@/features/production/types/production.types'

function createRepository(): ProductionRepository {
  if (usesCloudPersistence()) {
    return new ApiProductionRepository()
  }

  return new MockProductionRepository()
}

const repository = createRepository()

export const productionService = {
  list(filters?: ProductionFilters): Promise<ProductionDay[]> {
    return repository.list(filters)
  },

  getById(id: string): Promise<ProductionDay | null> {
    return repository.getById(id)
  },

  create(input: CreateProductionInput): Promise<ProductionDay> {
    return repository.create(input)
  },

  update(id: string, input: UpdateProductionInput): Promise<ProductionDay> {
    return repository.update(id, input)
  },

  remove(id: string): Promise<void> {
    return repository.remove(id)
  },

  duplicate(input: DuplicateProductionInput): Promise<ProductionDay> {
    return repository.duplicate(input)
  },

  reorderItems(input: ReorderProductionItemsInput): Promise<ProductionDay> {
    return repository.reorderItems(input)
  },

  updateItemStatus(input: UpdateProductionItemStatusInput): Promise<ProductionDay> {
    return repository.updateItemStatus(input)
  },

  updateItemConference(input: UpdateProductionItemConferenceInput): Promise<ProductionDay> {
    return repository.updateItemConference(input)
  },

  addComment(input: AddShiftCommentInput): Promise<ProductionDay> {
    return repository.addComment(input)
  },
}
