import { monthlyScheduleRepository } from '@/features/schedule/repositories/MockMonthlyScheduleRepository'
import type {
  ImportMonthlyScheduleInput,
  MonthlySchedule,
  SwapMonthlyDaysInput,
  UpdateMonthlyDayInput,
} from '@/features/schedule/types/monthlySchedule.types'
import { buildScheduleAttachmentFromFile } from '@/features/schedule/utils/buildScheduleAttachment'
import { parseMonthlyScheduleFile } from '@/features/schedule/utils/parseMonthlyScheduleExcel'
import { matchEmployeeIdByScheduleName } from '@/features/schedule/utils/matchScheduleEmployee'

export const monthlyScheduleService = {
  list(): Promise<MonthlySchedule[]> {
    return monthlyScheduleRepository.list()
  },

  getByYearMonth(year: number, month: number): Promise<MonthlySchedule | null> {
    return monthlyScheduleRepository.getByYearMonth(year, month)
  },

  getById(id: string): Promise<MonthlySchedule | null> {
    return monthlyScheduleRepository.getById(id)
  },

  async importFromFile(file: File): Promise<MonthlySchedule> {
    let attachment = null
    let parsed = null

    try {
      parsed = await parseMonthlyScheduleFile(file)
    } catch {
      parsed = null
    }

    attachment = await buildScheduleAttachmentFromFile(file)

    if (!parsed) {
      const now = new Date()
      return monthlyScheduleRepository.importSchedule({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        label: `Escala importada — ${file.name}`,
        daysInMonth: 31,
        weekdayLabels: [],
        rows: [],
        attachment,
      })
    }

    return monthlyScheduleRepository.importSchedule({
      year: parsed.year,
      month: parsed.month,
      label: parsed.label,
      daysInMonth: parsed.daysInMonth,
      weekdayLabels: parsed.weekdayLabels,
      rows: parsed.rows.map((row) => ({
        employeeId: matchEmployeeIdByScheduleName(row.employeeName),
        employeeName: row.employeeName,
        position: row.position,
        shift: row.shift,
        shiftCode: row.shiftCode,
        days: row.days,
      })),
      attachment,
    })
  },

  updateDay(input: UpdateMonthlyDayInput): Promise<MonthlySchedule> {
    return monthlyScheduleRepository.updateDay(input)
  },

  swapDays(input: SwapMonthlyDaysInput): Promise<MonthlySchedule> {
    return monthlyScheduleRepository.swapDays(input)
  },

  toggleDay(scheduleId: string, rowId: string, day: number): Promise<MonthlySchedule> {
    return monthlyScheduleRepository.toggleDay(scheduleId, rowId, day)
  },

  importSchedule(input: ImportMonthlyScheduleInput): Promise<MonthlySchedule> {
    return monthlyScheduleRepository.importSchedule(input)
  },
}
