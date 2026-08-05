import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AssignmentService } from '@/features/assignment/services/AssignmentService'
import type { AssignmentSector } from '@/features/assignment/types/assignment.types'
import { employeesService } from '@/features/employees/services/employees.service'
import { monthlyScheduleService } from '@/features/schedule/services/monthlySchedule.service'
import { scheduleService } from '@/features/schedule/services/schedule.service'

export function useAssignableEmployees(date: string, sector: AssignmentSector) {
  const year = Number(date.slice(0, 4))
  const month = Number(date.slice(5, 7))
  const day = Number(date.slice(8, 10))

  const monthlyQuery = useQuery({
    queryKey: ['monthly-schedule', year, month],
    queryFn: () => monthlyScheduleService.getByYearMonth(year, month),
    enabled: Boolean(date),
    staleTime: 30_000,
  })

  const dailyQuery = useQuery({
    queryKey: ['schedule', 'daily'],
    queryFn: () => scheduleService.list(),
    staleTime: 30_000,
  })

  const employeesQuery = useQuery({
    queryKey: ['employees', 'assignment'],
    queryFn: () => employeesService.list(),
    staleTime: 60_000,
  })

  const candidates = useMemo(() => {
    const monthlyRows =
      monthlyQuery.data?.rows.map((row) => ({
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        position: row.position,
        shift: row.shift,
        shiftCode: row.shiftCode,
        dayStatus: row.days.find((entry) => entry.day === day)?.status ?? null,
      })) ?? []

    return AssignmentService.listCandidates({
      date,
      sector,
      monthlyRows,
      dailyEntries: (dailyQuery.data ?? []).map((entry) => ({
        employeeId: entry.employeeId,
        employeeName: entry.employeeName,
        sector: entry.sector,
        shift: entry.shift,
        status: entry.status,
        notes: entry.notes,
      })),
      employees: (employeesQuery.data ?? []).map((employee) => ({
        id: employee.id,
        name: employee.name,
        position: employee.position,
        sector: employee.sector,
        shift: employee.shift,
        status: employee.status,
        ...(employee.photoUrl ? { photoUrl: employee.photoUrl } : {}),
      })),
    })
  }, [monthlyQuery.data, dailyQuery.data, employeesQuery.data, date, sector, day])

  return {
    candidates,
    selectable: candidates.filter((item) => item.selectable),
    isLoading: monthlyQuery.isLoading || dailyQuery.isLoading || employeesQuery.isLoading,
    isFetching: monthlyQuery.isFetching || dailyQuery.isFetching || employeesQuery.isFetching,
    refetch: async () => {
      await Promise.all([monthlyQuery.refetch(), dailyQuery.refetch(), employeesQuery.refetch()])
    },
  }
}
