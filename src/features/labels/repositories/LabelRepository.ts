import type {
  CreateLabelFromProductionInput,
  CreateLabelInput,
  LabelListQuery,
  LabelListResult,
  LabelRecord,
  LabelTemplateConfig,
} from '@/features/labels/types/label.types'

export interface LabelRepository {
  listTemplates(): Promise<LabelTemplateConfig[]>
  list(query?: LabelListQuery): Promise<LabelListResult>
  getById(id: string): Promise<LabelRecord | null>
  create(input: CreateLabelInput): Promise<LabelRecord>
  createFromProduction(input: CreateLabelFromProductionInput): Promise<LabelRecord>
  reprint(id: string, copies: number): Promise<LabelRecord>
}
