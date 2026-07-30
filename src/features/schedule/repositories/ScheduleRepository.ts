import type {
  CreateScheduleInput,
  ScheduleEntry,
  ScheduleFilters,
  UpdateScheduleInput,
} from '@/features/schedule/types/schedule.types'

export interface ScheduleRepository {
  list(filters?: ScheduleFilters): Promise<ScheduleEntry[]>
  getById(id: string): Promise<ScheduleEntry | null>
  create(input: CreateScheduleInput): Promise<ScheduleEntry>
  update(id: string, input: UpdateScheduleInput): Promise<ScheduleEntry>
  remove(id: string): Promise<void>
}
