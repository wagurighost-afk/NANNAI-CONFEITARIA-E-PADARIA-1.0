import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createBugReport,
  fetchBugModules,
  fetchBugs,
  updateBugStatus,
  type CreateBugPayload,
} from '@/features/bugs/services/bugs.service'
import type { BugFilters, BugStatus } from '@/features/bugs/types/bug.types'

export const BUGS_QUERY_KEY = ['bugs'] as const
export const BUG_MODULES_QUERY_KEY = ['bugs', 'modules'] as const

const DEFAULT_FILTERS: BugFilters = {
  search: '',
  status: 'all',
  priority: 'all',
  moduleId: 'all',
}

export function useBugs() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<BugFilters>(DEFAULT_FILTERS)

  const modulesQuery = useQuery({
    queryKey: BUG_MODULES_QUERY_KEY,
    queryFn: fetchBugModules,
  })

  const bugsQuery = useQuery({
    queryKey: [...BUGS_QUERY_KEY, filters],
    queryFn: () =>
      fetchBugs({
        search: filters.search,
        status: filters.status,
        priority: filters.priority,
        moduleId: filters.moduleId,
      }),
  })

  const summary = useMemo(() => {
    const items = bugsQuery.data?.items ?? []
    return {
      total: bugsQuery.data?.total ?? 0,
      aberto: items.filter((item) => item.status === 'aberto').length,
      emAnalise: items.filter((item) => item.status === 'em_analise').length,
      corrigindo: items.filter((item) => item.status === 'corrigindo').length,
      resolvido: items.filter((item) => item.status === 'resolvido').length,
    }
  }, [bugsQuery.data])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: BUGS_QUERY_KEY })
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateBugPayload) => createBugReport(input),
    onSuccess: invalidate,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: BugStatus; note?: string }) =>
      updateBugStatus(id, { status, ...(note ? { note } : {}) }),
    onSuccess: invalidate,
  })

  return {
    bugs: bugsQuery.data?.items ?? [],
    total: bugsQuery.data?.total ?? 0,
    summary,
    modules: modulesQuery.data ?? [],
    filters,
    setFilters,
    isLoading: bugsQuery.isLoading || modulesQuery.isLoading,
    isSubmitting: createMutation.isPending,
    isUpdatingStatus: statusMutation.isPending,
    createBug: createMutation.mutateAsync,
    updateStatus: statusMutation.mutateAsync,
  }
}
