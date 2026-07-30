export interface ApiErrorBody {
  message: string
  code?: string
  details?: Record<string, string[]>
}

export interface ApiResponse<TData> {
  data: TData
  message?: string
}

export interface PaginatedResponse<TItem> {
  items: TItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  search?: string
}
