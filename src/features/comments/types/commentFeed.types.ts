import type { ShiftComment } from '@/features/production/types/production.types'

export interface CommentFeedItem extends ShiftComment {
  productionId: string
  productionCode: string
  employeeName: string
  date: string
  shift: string
  sector: string
}
