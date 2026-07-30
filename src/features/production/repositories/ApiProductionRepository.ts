import { apiClient } from '@/core/api/apiClient'
import type { ProductionRepository } from '@/features/production/repositories/ProductionRepository'
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

function mapProduction(production: ProductionDay): ProductionDay {
  return {
    ...production,
    comments: (production.comments ?? []).map((comment) => ({
      ...comment,
      photos: (comment.photos ?? []).map((photo) => ({
        ...photo,
        fileUrl: photo.fileUrl.startsWith('http')
          ? photo.fileUrl
          : `${window.location.origin}${photo.fileUrl}`,
      })),
    })),
  }
}

export class ApiProductionRepository implements ProductionRepository {
  async list(filters?: ProductionFilters): Promise<ProductionDay[]> {
    const { data } = await apiClient.get<ProductionDay[]>('/production', { params: filters })
    return data.map(mapProduction)
  }

  async getById(id: string): Promise<ProductionDay | null> {
    try {
      const { data } = await apiClient.get<ProductionDay>(`/production/${id}`)
      return mapProduction(data)
    } catch {
      return null
    }
  }

  async create(input: CreateProductionInput): Promise<ProductionDay> {
    const { data } = await apiClient.post<ProductionDay>('/production', input)
    return mapProduction(data)
  }

  async update(id: string, input: UpdateProductionInput): Promise<ProductionDay> {
    const { data } = await apiClient.put<ProductionDay>(`/production/${id}`, input)
    return mapProduction(data)
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/production/${id}`)
  }

  async duplicate(input: DuplicateProductionInput): Promise<ProductionDay> {
    const { data } = await apiClient.post<ProductionDay>(`/production/${input.sourceId}/duplicate`, input)
    return mapProduction(data)
  }

  async reorderItems(input: ReorderProductionItemsInput): Promise<ProductionDay> {
    const { data } = await apiClient.patch<ProductionDay>(
      `/production/${input.productionId}/items/reorder`,
      { itemIds: input.itemIds },
    )
    return mapProduction(data)
  }

  async updateItemStatus(input: UpdateProductionItemStatusInput): Promise<ProductionDay> {
    const { data } = await apiClient.patch<ProductionDay>(
      `/production/${input.productionId}/items/${input.itemId}/status`,
      { status: input.status },
    )
    return mapProduction(data)
  }

  async addComment(input: AddShiftCommentInput): Promise<ProductionDay> {
    const formData = new FormData()
    formData.append('message', input.message)
    formData.append('authorId', input.authorId)
    formData.append('authorName', input.authorName)
    input.photos?.forEach((photo) => {
      formData.append('photos', photo)
    })

    const { data } = await apiClient.post<ProductionDay>(
      `/production/${input.productionId}/comments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return mapProduction(data)
  }
}
