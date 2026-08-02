import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAuditLogs } from '@/features/audit/services/audit.service'
import type { AuditAction, AuditEntityType } from '@/features/audit/types/audit.types'

const PAGE_SIZE = 25

export function useAuditLogs() {
  const [entityType, setEntityType] = useState<AuditEntityType | ''>('')
  const [action, setAction] = useState<AuditAction | ''>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)

  const filters = useMemo(
    () => ({
      ...(entityType ? { entityType } : {}),
      ...(action ? { action } : {}),
      ...(search.trim() ? { entityId: search.trim() } : {}),
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [entityType, action, search, page],
  )

  const query = useQuery({
    queryKey: ['audit', 'logs', filters],
    queryFn: () => fetchAuditLogs(filters),
    staleTime: 30_000,
  })

  const selectedLog = useMemo(
    () => query.data?.items.find((item) => item.id === selectedLogId) ?? null,
    [query.data?.items, selectedLogId],
  )

  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE_SIZE))

  return {
    logs: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    entityType,
    setEntityType,
    action,
    setAction,
    search,
    setSearch: (value: string) => {
      setSearch(value)
      setPage(0)
    },
    page,
    setPage,
    totalPages,
    selectedLog,
    selectLog: setSelectedLogId,
    clearSelection: () => setSelectedLogId(null),
    refetch: query.refetch,
  }
}
