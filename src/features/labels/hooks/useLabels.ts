import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createLabel,
  createLabelFromProduction,
  fetchLabelById,
  fetchLabels,
  fetchLabelTemplates,
  reprintLabel,
} from '@/features/labels/services/labels.service'
import type {
  CreateLabelFromProductionInput,
  CreateLabelInput,
  LabelListQuery,
} from '@/features/labels/types/label.types'

const LABELS_KEY = ['labels'] as const

export function useLabelTemplates() {
  return useQuery({
    queryKey: [...LABELS_KEY, 'templates'],
    queryFn: fetchLabelTemplates,
    staleTime: 60_000,
  })
}

export function useLabels(query: LabelListQuery = {}) {
  return useQuery({
    queryKey: [...LABELS_KEY, 'list', query],
    queryFn: () => fetchLabels(query),
  })
}

export function useLabel(id: string | null) {
  return useQuery({
    queryKey: [...LABELS_KEY, 'detail', id],
    queryFn: () => fetchLabelById(id!),
    enabled: Boolean(id),
  })
}

export function useLabelMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: LABELS_KEY })
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateLabelInput) => createLabel(input),
    onSuccess: invalidate,
  })

  const createFromProductionMutation = useMutation({
    mutationFn: (input: CreateLabelFromProductionInput) => createLabelFromProduction(input),
    onSuccess: invalidate,
  })

  const reprintMutation = useMutation({
    mutationFn: ({ id, copies }: { id: string; copies: number }) => reprintLabel(id, copies),
    onSuccess: invalidate,
  })

  return {
    createMutation,
    createFromProductionMutation,
    reprintMutation,
  }
}
