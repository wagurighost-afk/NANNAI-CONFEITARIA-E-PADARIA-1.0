import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { scheduleService } from '@/features/schedule/services/schedule.service'
import { computeScheduleKpis } from '@/features/schedule/utils/computeScheduleKpis'
import type {
  CreateScheduleInput,
  ScheduleEntry,
  ScheduleFilters,
  UpdateScheduleInput,
} from '@/features/schedule/types/schedule.types'

const SCHEDULE_QUERY_KEY = ['schedule'] as const

const DEFAULT_FILTERS: ScheduleFilters = {
  search: '',
  sector: 'all',
  shift: 'all',
  status: 'all',
}

export function useSchedule() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<ScheduleFilters>(DEFAULT_FILTERS)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null)
  const [entryPendingDelete, setEntryPendingDelete] = useState<ScheduleEntry | null>(null)

  const allQuery = useQuery({
    queryKey: [...SCHEDULE_QUERY_KEY, 'all'],
    queryFn: () => scheduleService.list(),
  })

  const listQuery = useQuery({
    queryKey: [...SCHEDULE_QUERY_KEY, 'filtered', filters],
    queryFn: () => scheduleService.list(filters),
  })

  const kpis = useMemo(() => computeScheduleKpis(allQuery.data ?? []), [allQuery.data])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY })
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateScheduleInput) => scheduleService.create(input),
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateScheduleInput }) =>
      scheduleService.update(id, input),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scheduleService.remove(id),
    onSuccess: invalidate,
  })

  return {
    entries: listQuery.data ?? [],
    kpis,
    isLoading: listQuery.isLoading,
    isKpisLoading: allQuery.isLoading,
    filters,
    setFilters,
    isFormOpen,
    editingEntry,
    openCreateForm: () => {
      setEditingEntry(null)
      setIsFormOpen(true)
    },
    openEditForm: (entry: ScheduleEntry) => {
      setEditingEntry(entry)
      setIsFormOpen(true)
    },
    closeForm: () => {
      setIsFormOpen(false)
      setEditingEntry(null)
    },
    entryPendingDelete,
    requestDelete: setEntryPendingDelete,
    cancelDelete: () => {
      setEntryPendingDelete(null)
    },
    confirmDelete: async () => {
      if (!entryPendingDelete) {
        return
      }
      const id = entryPendingDelete.id
      setEntryPendingDelete(null)
      await deleteMutation.mutateAsync(id)
    },
    createEntry: createMutation.mutateAsync,
    updateEntry: updateMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
