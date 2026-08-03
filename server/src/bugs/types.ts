export const BUG_PRIORITIES = ['baixa', 'media', 'alta', 'critica'] as const
export type BugPriority = (typeof BUG_PRIORITIES)[number]

export const BUG_STATUSES = ['aberto', 'em_analise', 'corrigindo', 'resolvido'] as const
export type BugStatus = (typeof BUG_STATUSES)[number]

export interface BugAttachment {
  id: string
  fileName: string
  mimeType: string
  fileUrl: string
  kind: 'image' | 'video'
}

export interface BugStatusHistoryEntry {
  id: string
  fromStatus: BugStatus | null
  toStatus: BugStatus
  changedById: string
  changedByName: string
  note?: string
  changedAt: string
}

export interface BugReport {
  id: string
  title: string
  description: string
  moduleId: string
  moduleName: string
  priority: BugPriority
  status: BugStatus
  images: BugAttachment[]
  video?: BugAttachment
  os: string
  browser: string
  appVersion: string
  reportedById: string
  reportedByName: string
  reportedByEmail: string
  createdAt: string
  updatedAt: string
  history: BugStatusHistoryEntry[]
}

export interface BugListQuery {
  search?: string
  status?: BugStatus | 'all'
  priority?: BugPriority | 'all'
  moduleId?: string | 'all'
  reportedById?: string | 'all'
  limit?: number
  offset?: number
}

export interface BugListResult {
  total: number
  items: BugReport[]
}

export interface CreateBugInput {
  title: string
  description: string
  moduleId: string
  moduleName: string
  priority: BugPriority
  os: string
  browser: string
  appVersion: string
  reportedById: string
  reportedByName: string
  reportedByEmail: string
  images?: BugAttachment[]
  video?: BugAttachment
}

export interface UpdateBugStatusInput {
  status: BugStatus
  note?: string
  changedById: string
  changedByName: string
}
