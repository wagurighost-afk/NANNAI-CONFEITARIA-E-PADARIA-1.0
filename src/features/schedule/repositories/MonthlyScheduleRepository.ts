import type {
  ImportMonthlyScheduleInput,
  MonthlySchedule,
  SwapMonthlyDaysInput,
  UpdateMonthlyDayInput,
} from '@/features/schedule/types/monthlySchedule.types'

export interface MonthlyScheduleRepository {
  list(): Promise<MonthlySchedule[]>
  getByYearMonth(year: number, month: number): Promise<MonthlySchedule | null>
  getById(id: string): Promise<MonthlySchedule | null>
  importSchedule(input: ImportMonthlyScheduleInput): Promise<MonthlySchedule>
  updateDay(input: UpdateMonthlyDayInput): Promise<MonthlySchedule>
  swapDays(input: SwapMonthlyDaysInput): Promise<MonthlySchedule>
}
