import { apiClient } from '@/core/api/apiClient'
import type {
  CatalogProduct,
  CreateProductInput,
  ProductImportSummary,
  UpdateProductInput,
} from '@/features/products/types/product.types'

export const productsService = {
  async list(search = ''): Promise<CatalogProduct[]> {
    const { data } = await apiClient.get<CatalogProduct[]>('/products', {
      params: search ? { search } : undefined,
    })
    return data
  },

  async getById(id: string): Promise<CatalogProduct> {
    const { data } = await apiClient.get<CatalogProduct>(`/products/${id}`)
    return data
  },

  async create(input: CreateProductInput): Promise<CatalogProduct> {
    const { data } = await apiClient.post<CatalogProduct>('/products', input)
    return data
  },

  async update(id: string, input: UpdateProductInput): Promise<CatalogProduct> {
    const { data } = await apiClient.patch<CatalogProduct>(`/products/${id}`, input)
    return data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`)
  },

  async importMasterPart1(): Promise<ProductImportSummary> {
    const { data } = await apiClient.post<ProductImportSummary>('/products/import/master-part-1')
    return data
  },

  async importMasterPart2(): Promise<ProductImportSummary> {
    const { data } = await apiClient.post<ProductImportSummary>('/products/import/master-part-2')
    return data
  },

  async importMasterPart3(): Promise<ProductImportSummary> {
    const { data } = await apiClient.post<ProductImportSummary>('/products/import/master-part-3')
    return data
  },

  async importMasterAll(): Promise<ProductImportSummary> {
    const { data } = await apiClient.post<ProductImportSummary>('/products/import/master')
    return data
  },

  async getLastImportSummary(): Promise<ProductImportSummary | null> {
    const { data } = await apiClient.get<ProductImportSummary | null>('/products/import-summary')
    return data
  },
}
