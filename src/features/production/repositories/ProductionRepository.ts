import type {
  AddShiftCommentInput,
  CreateProductionInput,
  DuplicateProductionInput,
  ProductionDay,
  ProductionFilters,
  ReorderProductionItemsInput,
  UpdateProductionInput,
  UpdateProductionItemStatusInput,
} from '@/features/production/types/production.types'

export interface ProductionRepository {
  list(filters?: ProductionFilters): Promise<ProductionDay[]>
  getById(id: string): Promise<ProductionDay | null>
  create(input: CreateProductionInput): Promise<ProductionDay>
  update(id: string, input: UpdateProductionInput): Promise<ProductionDay>
  remove(id: string): Promise<void>
  duplicate(input: DuplicateProductionInput): Promise<ProductionDay>
  reorderItems(input: ReorderProductionItemsInput): Promise<ProductionDay>
  updateItemStatus(input: UpdateProductionItemStatusInput): Promise<ProductionDay>
  addComment(input: AddShiftCommentInput): Promise<ProductionDay>
}
