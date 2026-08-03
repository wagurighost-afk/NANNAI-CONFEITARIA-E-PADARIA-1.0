import { ApiMonthlyScheduleRepository } from '@/features/schedule/repositories/ApiMonthlyScheduleRepository'
import { MockMonthlyScheduleRepository } from '@/features/schedule/repositories/MockMonthlyScheduleRepository'
import type { MonthlyScheduleRepository } from '@/features/schedule/repositories/MonthlyScheduleRepository'
import { usesCloudPersistence } from '@/core/persistence/cloudPersistence'
import type {
  ImportMonthlyScheduleInput,
  MonthlySchedule,
  SwapMonthlyDaysInput,
  UpdateMonthlyDayInput,
} from '@/features/schedule/types/monthlySchedule.types'
import { buildScheduleAttachmentFromFile } from '@/features/schedule/utils/buildScheduleAttachment'
import { parseMonthlyScheduleFile } from '@/features/schedule/utils/parseMonthlyScheduleExcel'
import { matchEmployeeIdByScheduleName } from '@/features/schedule/utils/matchScheduleEmployee'

const repository: MonthlyScheduleRepository = usesCloudPersistence()
  ? new ApiMonthlyScheduleRepository()
  : new MockMonthlyScheduleRepository()

export const monthlyScheduleService = {
  list(): Promise<MonthlySchedule[]> {
    return repository.list()
  },

  getByYearMonth(year: number, month: number): Promise<MonthlySchedule | null> {
    return repository.getByYearMonth(year, month)
  },

  getById(id: string): Promise<MonthlySchedule | null> {
    return repository.getById(id)
  },

  async importFromFile(file: File): Promise<MonthlySchedule> {
    let parsed = null

    try {
      parsed = await parseMonthlyScheduleFile(file)
    } catch {
      parsed = null
    }

    if (!usesCloudPersistence()) {
      const attachment = await buildScheduleAttachmentFromFile(file)

      if (!parsed) {
        const now = new Date()
        return repository.importSchedule({
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          label: `Escala importada — ${file.name}`,
          daysInMonth: 31,
          weekdayLabels: [],
          rows: [],
          attachment,
        })
      }

      return repository.importSchedule({
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
    }

    if (!parsed) {
      const now = new Date()
      return repository.importSchedule(
        {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          label: `Escala importada — ${file.name}`,
          daysInMonth: 31,
          weekdayLabels: [],
          rows: [],
          attachment: null,
        },
        file,
      )
    }

    return repository.importSchedule(
      {
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
        attachment: null,
      },
      file,
    )
  },

  updateDay(input: UpdateMonthlyDayInput): Promise<MonthlySchedule> {
    return repository.updateDay(input)
  },

  swapDays(input: SwapMonthlyDaysInput): Promise<MonthlySchedule> {
    return repository.swapDays(input)
  },

  toggleDay(scheduleId: string, rowId: string, day: number): Promise<MonthlySchedule> {
    return repository.toggleDay(scheduleId, rowId, day)
  },

  importSchedule(input: ImportMonthlyScheduleInput, file?: File): Promise<MonthlySchedule> {
    return repository.importSchedule(input, file)
  },
}
