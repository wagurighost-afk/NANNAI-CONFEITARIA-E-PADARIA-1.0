import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAppCurrentYearMonth } from '@/core/constants/appDate'
import { monthlyScheduleService } from '@/features/schedule/services/monthlySchedule.service'
import type {
  MonthlyDayStatus,
  MonthlySchedule,
  MonthlyScheduleDay,
} from '@/features/schedule/types/monthlySchedule.types'

const QUERY_KEY = ['monthly-schedule'] as const

export function useMonthlySchedule(initialYear?: number, initialMonth?: number) {
  const queryClient = useQueryClient()
  const [operationalMonth] = useState(() => getAppCurrentYearMonth())

  const [year, setYear] = useState(initialYear ?? operationalMonth.year)
  const [month, setMonth] = useState(initialMonth ?? operationalMonth.month)
  const [swapMode, setSwapMode] = useState(false)
  const [swapSource, setSwapSource] = useState<{ rowId: string; day: number } | null>(null)

  const listQuery = useQuery({
    queryKey: [...QUERY_KEY, 'list'],
    queryFn: () => monthlyScheduleService.list(),
  })

  const currentQuery = useQuery({
    queryKey: [...QUERY_KEY, year, month],
    queryFn: () => monthlyScheduleService.getByYearMonth(year, month),
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }

  const importMutation = useMutation({
    mutationFn: (file: File) => monthlyScheduleService.importFromFile(file),
    onSuccess: async (schedule) => {
      setYear(schedule.year)
      setMonth(schedule.month)
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
