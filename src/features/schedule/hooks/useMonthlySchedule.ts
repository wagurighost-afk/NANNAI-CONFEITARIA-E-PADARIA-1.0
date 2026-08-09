import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAppCurrentYearMonth } from '@/core/constants/appDate'
import { monthlyScheduleService } from '@/features/schedule/services/monthlySchedule.service'
import type {
  MonthlyDayStatus,
  MonthlySchedule,
  MonthlyScheduleDay,
} from '@/features/schedule/types/monthlySchedule.types'

const QUERY_KEY = ['monthly-schedule'] as const

function pickInitialPeriod(
  available: Array<{ year: number; month: number }> | undefined,
  preferred: { year: number; month: number },
): { year: number; month: number } {
  if (!available?.length) {
    return preferred
  }
  const hasCurrent = available.some(
    (item) => item.year === preferred.year && item.month === preferred.month,
  )
  if (hasCurrent) {
    return preferred
  }
  const latest = [...available].sort((a, b) => b.year - a.year || b.month - a.month)[0]
  return latest ?? preferred
}

export function useMonthlySchedule(initialYear?: number, initialMonth?: number) {
  const queryClient = useQueryClient()
  const currentPeriod = getAppCurrentYearMonth()
  const [year, setYear] = useState(initialYear ?? currentPeriod.year)
  const [month, setMonth] = useState(initialMonth ?? currentPeriod.month)
  const [swapMode, setSwapMode] = useState(false)
  const [swapSource, setSwapSource] = useState<{ rowId: string; day: number } | null>(null)
  const [didResolvePeriod, setDidResolvePeriod] = useState(
    initialYear !== undefined && initialMonth !== undefined,
  )

  const listQuery = useQuery({
    queryKey: [...QUERY_KEY, 'list'],
    queryFn: () => monthlyScheduleService.list(),
  })

  const currentQuery = useQuery({
    queryKey: [...QUERY_KEY, year, month],
    queryFn: () => monthlyScheduleService.getByYearMonth(year, month),
  })

  useEffect(() => {
    if (didResolvePeriod || listQuery.isLoading || !listQuery.data) {
      return
    }

    const next = pickInitialPeriod(
      listQuery.data.map((schedule) => ({ year: schedule.year, month: schedule.month })),
      currentPeriod,
    )
    setYear(next.year)
    setMonth(next.month)
    setDidResolvePeriod(true)
  }, [currentPeriod, didResolvePeriod, listQuery.data, listQuery.isLoading])

  useEffect(() => {
    if (!didResolvePeriod || currentQuery.isFetching || currentQuery.data || !listQuery.data?.length) {
      return
    }

    const latest = [...listQuery.data].sort(
      (a, b) => b.year - a.year || b.month - a.month,
    )[0]
    if (latest && (latest.year !== year || latest.month !== month)) {
      setYear(latest.year)
      setMonth(latest.month)
    }
  }, [
    currentQuery.data,
    currentQuery.isFetching,
    didResolvePeriod,
    listQuery.data,
    month,
    year,
  ])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }

  const importMutation = useMutation({
    mutationFn: (file: File) => monthlyScheduleService.importFromFile(file),
    onSuccess: async (schedule) => {
      setYear(schedule.year)
      setMonth(schedule.month)
      setDidResolvePeriod(true)
      await invalidate()
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({
      scheduleId,
      rowId,
      day,
    }: {
      scheduleId: string
      rowId: string
      day: number
    }) => monthlyScheduleService.toggleDay(scheduleId, rowId, day),
    onSuccess: invalidate,
  })

  const swapMutation = useMutation({
    mutationFn: monthlyScheduleService.swapDays.bind(monthlyScheduleService),
    onSuccess: async () => {
      setSwapSource(null)
      setSwapMode(false)
      await invalidate()
    },
  })

  const availableMonths = useMemo(
    () =>
      (listQuery.data ?? []).map((schedule) => ({
        year: schedule.year,
        month: schedule.month,
        label: schedule.label,
        id: schedule.id,
      })),
    [listQuery.data],
  )

  return {
    schedule: currentQuery.data ?? null,
    availableMonths,
    year,
    month,
    setYear,
    setMonth,
    isLoading: currentQuery.isLoading || listQuery.isLoading,
    importSchedule: importMutation.mutateAsync,
    isImporting: importMutation.isPending,
    toggleDay: toggleMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
    swapSource,
    setSwapSource,
    swapMode,
    setSwapMode,
    swapDays: swapMutation.mutateAsync,
    isSwapping: swapMutation.isPending,
  }
}

export function getEmployeeDaysOff(
  schedule: MonthlySchedule | null,
  employeeId: string | null,
): MonthlyScheduleDay[] {
  if (!schedule || !employeeId) {
    return []
  }

  const row = schedule.rows.find((item) => item.employeeId === employeeId)
  if (!row) {
    return []
  }

  return row.days.filter((day) => day.status !== 'work')
}

export function getEmployeeScheduleRow(schedule: MonthlySchedule | null, employeeId: string | null) {
  if (!schedule || !employeeId) {
    return null
  }
  return schedule.rows.find((item) => item.employeeId === employeeId) ?? null
}

export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
}

export const DAY_STATUS_CYCLE: MonthlyDayStatus[] = ['work', 'off', 'vacation', 'leave', 'other']
