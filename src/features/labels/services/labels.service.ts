import { env } from '@/config/env'
import { ApiLabelRepository } from '@/features/labels/repositories/ApiLabelRepository'
import { MockLabelRepository } from '@/features/labels/repositories/MockLabelRepository'
import type { LabelRepository } from '@/features/labels/repositories/LabelRepository'
import type {
  CreateLabelFromProductionInput,
  CreateLabelInput,
  LabelListQuery,
  LabelListResult,
  LabelRecord,
  LabelTemplateConfig,
} from '@/features/labels/types/label.types'

const repository: LabelRepository = env.useMock
  ? new MockLabelRepository()
  : new ApiLabelRepository()

export async function fetchLabelTemplates(): Promise<LabelTemplateConfig[]> {
  return repository.listTemplates()
}

export async function fetchLabels(query: LabelListQuery = {}): Promise<LabelListResult> {
  return repository.list(query)
}

export async function fetchLabelById(id: string): Promise<LabelRecord> {
  const record = await repository.getById(id)
  if (!record) {
    throw new Error('Etiqueta não encontrada.')
  }
  return record
}

export async function createLabel(input: CreateLabelInput): Promise<LabelRecord> {
  return repository.create(input)
}

export async function createLabelFromProduction(
  input: CreateLabelFromProductionInput,
): Promise<LabelRecord> {
  return repository.createFromProduction(input)
}

export async function reprintLabel(id: string, copies: number): Promise<LabelRecord> {
  return repository.reprint(id, copies)
}

export const labelsService = {
  fetchLabelTemplates,
  fetchLabels,
  fetchLabelById,
  createLabel,
  createLabelFromProduction,
  reprintLabel,
}
