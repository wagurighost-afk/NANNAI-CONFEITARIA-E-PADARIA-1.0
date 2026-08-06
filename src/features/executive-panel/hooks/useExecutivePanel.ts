import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { EXECUTIVE_PANEL_QUERY_KEY } from '@/features/executive-panel/constants/executivePanel.constants'
import { executivePanelService } from '@/features/executive-panel/services/executivePanel.service'
import type {
  ExecutivePanelQuery,
  ExecutivePeriodPreset,
} from '@/features/executive-panel/types/executivePanel.types'

function getOperationalTodayIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function addDaysIso(isoDate: string, delta: number): string {
  const parts = isoDate.split('-').map(Number)
  const year = parts[0] ?? 1970
  const month = parts[1] ?? 1
  const day = parts[2] ?? 1
  const utc = new Date(Date.UTC(year, month - 1, day))
  utc.setUTCDate(utc.getUTCDate() + delta)
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, '0')}-${String(utc.getUTCDate()).padStart(2, '0')}`
}

export function useExecutivePanel() {
  const today = getOperationalTodayIso()
  const [preset, setPreset] = useState<ExecutivePeriodPreset>('today')
  const [customFrom, setCustomFrom] = useState(addDaysIso(today, -6))
  const [customTo, setCustomTo] = useState(today)

  const query = useMemo<ExecutivePanelQuery>(
    () => ({
      preset,
      ...(preset === 'custom' ? { from: customFrom, to: customTo } : {}),
    }),
    [preset, customFrom, customTo],
  )

  const dashboardQuery = useQuery({
    queryKey: [...EXECUTIVE_PANEL_QUERY_KEY, 'dashboard', query],
    queryFn: () => executivePanelService.getDashboard(query),
    refetchInterval: 30_000,
    staleTime: 15_000,
    placeholderData: (previous) => previous,
  })

  return {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    report: dashboardQuery.data ?? null,
    isLoading: dashboardQuery.isLoading,
    isFetching: dashboardQuery.isFetching,
    isError: dashboardQuery.isError,
    error: dashboardQuery.error,
    refetch: dashboardQuery.refetch,
  }
}
