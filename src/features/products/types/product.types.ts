export type ProductStatus = 'Ativo' | 'Inativo'
export type ProductOrigin = 'Cadastro Mestre' | 'Manual'

export interface CatalogProduct {
  id: string
  name: string
  nameKey: string
  costPerPortion: number
  status: ProductStatus
  origin: ProductOrigin
  editable: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductImportSummary {
  partLabel: string
  created: number
  updated: number
  ignored: number
  totalProcessed: number
  importedAt: string
}

export interface CreateProductInput {
  name: string
  costPerPortion: number
  status?: ProductStatus
}

export interface UpdateProductInput {
  name?: string
  costPerPortion?: number
  status?: ProductStatus
}
