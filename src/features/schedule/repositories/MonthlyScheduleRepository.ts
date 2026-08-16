import type {
  CreateMonthlyScheduleInput,
  ImportMonthlyScheduleInput,
  MonthlySchedule,
  SwapMonthlyDaysInput,
  UpdateMonthlyDayInput,
} from '@/features/schedule/types/monthlySchedule.types'

export interface MonthlyScheduleRepository {
  list(): Promise<MonthlySchedule[]>
  getByYearMonth(year: number, month: number): Promise<MonthlySchedule | null>
  getById(id: string): Promise<MonthlySchedule | null>
  createSchedule(input: CreateMonthlyScheduleInput): Promise<MonthlySchedule>
  importSchedule(input: ImportMonthlyScheduleInput, file?: File): Promise<MonthlySchedule>
  updateDay(input: UpdateMonthlyDayInput): Promise<MonthlySchedule>
  swapDays(input: SwapMonthlyDaysInput): Promise<MonthlySchedule>
  toggleDay(scheduleId: string, rowId: string, day: number): Promise<MonthlySchedule>
}
