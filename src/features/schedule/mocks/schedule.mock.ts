import { appDateTimeAt } from '@/core/constants/appDate'
import type { ScheduleEntry } from '@/features/schedule/types/schedule.types'
import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'

export const SCHEDULE_MOCK: ScheduleEntry[] = EMPLOYEES_MOCK.map((employee) => ({
  id: `sch-${employee.id}`,
  employeeId: employee.id,
  employeeName: employee.name,
  sector: employee.sector,
  shift: employee.shift,
  status: employee.status,
  notes: employee.notes ?? '',
  updatedAt: appDateTimeAt(21, 6),
}))
