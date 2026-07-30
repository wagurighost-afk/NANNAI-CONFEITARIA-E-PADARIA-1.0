import { useQuery } from '@tanstack/react-query'
import { getAppReferenceWeekday, getAppTodayIso } from '@/core/constants/appDate'
import { resolveEmployeeForUser } from '@/core/auth/employeeResolver'
import { cleaningScheduleService } from '@/features/cleaning-schedule/services/cleaningSchedule.service'
import { productionService } from '@/features/production/services/production.service'
import { scheduleService } from '@/features/schedule/services/schedule.service'
import { monthlyScheduleService } from '@/features/schedule/services/monthlySchedule.service'
import { getEmployeeDaysOff } from '@/features/schedule/hooks/useMonthlySchedule'
import { popService } from '@/features/pop/services/pop.service'
import { useAuth } from '@/hooks/useAuth'

export function useStaffDashboard() {
  const { user } = useAuth()
  const employee = resolveEmployeeForUser(user)
  const today = getAppTodayIso()
  const todayWeekDay = getAppReferenceWeekday()

  const productionQuery = useQuery({
    queryKey: ['dashboard', 'staff-production', employee?.id, today],
    queryFn: () =>
      productionService.list({
        search: '',
        date: today,
        shift: 'all',
        sector: 'all',
        employeeId: employee?.id ?? 'none',
        status: 'all',
      }),
    enabled: Boolean(employee?.id),
  })

  const scheduleQuery = useQuery({
    queryKey: ['dashboard', 'staff-schedule'],
    queryFn: () => scheduleService.list({ search: '', sector: 'all', shift: 'all', status: 'all' }),
  })

  const cleaningQuery = useQuery({
    queryKey: ['dashboard', 'staff-cleaning'],
    queryFn: () => cleaningScheduleService.get(),
  })

  const monthlyScheduleQuery = useQuery({
    queryKey: ['monthly-schedule', 2026, 7],
    queryFn: () => monthlyScheduleService.getByYearMonth(2026, 7),
  })

  const popQuery = useQuery({
    queryKey: ['dashboard', 'pop'],
    queryFn: () => popService.list(),
  })

  const myProduction = productionQuery.data?.[0] ?? null
  const mySchedule = scheduleQuery.data?.find((e) => e.employeeId === employee?.id) ?? null
  const todayCleaning =
    cleaningQuery.data?.days.find((d) => d.weekDay === todayWeekDay)?.assignments ?? []

  const myDaysOff = getEmployeeDaysOff(monthlyScheduleQuery.data ?? null, employee?.id ?? null)

  return {
    employee,
    myProduction,
    mySchedule,
    myDaysOff,
    monthlySchedule: monthlyScheduleQuery.data ?? null,
    todayCleaning,
    popDocuments: popQuery.data ?? [],
    recentComments: myProduction?.comments ?? [],
    isLoading:
      productionQuery.isLoading ||
      scheduleQuery.isLoading ||
      monthlyScheduleQuery.isLoading ||
      cleaningQuery.isLoading ||
      popQuery.isLoading,
  }
}
