import type {
  CleaningSchedule,
  UpdateCleaningDayInput,
} from '@/features/cleaning-schedule/types/cleaningSchedule.types'

export interface CleaningScheduleRepository {
  get(): Promise<CleaningSchedule>
  updateDay(input: UpdateCleaningDayInput): Promise<CleaningSchedule>
}
