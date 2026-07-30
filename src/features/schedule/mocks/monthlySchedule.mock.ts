import julySeed from '@/features/schedule/mocks/monthlySchedule.july2026.json'
import type { MonthlySchedule, MonthlyScheduleRow } from '@/features/schedule/types/monthlySchedule.types'
import { matchEmployeeIdByScheduleName } from '@/features/schedule/utils/matchScheduleEmployee'
import type { MonthlyDayStatus } from '@/features/schedule/types/monthlySchedule.types'

interface SeedEmployee {
  employeeName: string
  position: string
  shift: string
  shiftCode: string
  days: Array<{ day: number; status: MonthlyDayStatus; note?: string }>
}

function toRows(employees: SeedEmployee[]): MonthlyScheduleRow[] {
  return employees.map((employee, index) => ({
    id: `msr-jul-${index + 1}`,
    employeeId: matchEmployeeIdByScheduleName(employee.employeeName),
    employeeName: employee.employeeName,
    position: employee.position,
    shift: employee.shift,
    shiftCode: employee.shiftCode,
    days: employee.days,
  }))
}

export const JULY_2026_MONTHLY_SCHEDULE: MonthlySchedule = {
  id: 'ms-2026-07',
  year: 2026,
  month: 7,
  label: 'MÊS: JULHO 2026',
  daysInMonth: 31,
  weekdayLabels: [
    'QA', 'QI', 'SX', 'SÁB', 'DO', 'SE', 'TE',
    'QA', 'QI', 'SX', 'SÁB', 'DO', 'SE', 'TE',
    'QA', 'QI', 'SX', 'SÁB', 'DO', 'SE', 'TE',
    'QA', 'QI', 'SX', 'SÁB', 'DO', 'SE', 'TE',
    'QA', 'QI', 'SX',
  ],
  rows: toRows(julySeed.employees as SeedEmployee[]),
  attachment: null,
  updatedAt: '2026-07-01T00:00:00.000Z',
}
