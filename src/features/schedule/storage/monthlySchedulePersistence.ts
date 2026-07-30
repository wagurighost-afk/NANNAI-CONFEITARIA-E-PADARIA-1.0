import { storage } from '@/core/storage/storage'
import { JULY_2026_MONTHLY_SCHEDULE } from '@/features/schedule/mocks/monthlySchedule.mock'
import { resolveScheduleAttachmentUrl } from '@/features/schedule/storage/scheduleAttachmentBlobStore'
import type {
  ImportMonthlyScheduleInput,
  MonthlySchedule,
  MonthlyScheduleAttachment,
  SwapMonthlyDaysInput,
  UpdateMonthlyDayInput,
} from '@/features/schedule/types/monthlySchedule.types'

const STORE_KEY = 'nannai_monthly_schedules_v1'

function defaultStore(): MonthlySchedule[] {
  return [structuredClone(JULY_2026_MONTHLY_SCHEDULE)]
}

async function hydrateAttachment(
  attachment: MonthlyScheduleAttachment | null,
): Promise<MonthlyScheduleAttachment | null> {
  if (!attachment) {
    return null
  }
  const fileUrl = await resolveScheduleAttachmentUrl(attachment.id, attachment.fileUrl)
  return { ...attachment, fileUrl: fileUrl ?? '' }
}

async function hydrateSchedule(schedule: MonthlySchedule): Promise<MonthlySchedule> {
  return {
    ...schedule,
    attachment: await hydrateAttachment(schedule.attachment),
  }
}

export async function loadPersistedMonthlySchedules(): Promise<MonthlySchedule[]> {
  const raw = storage.get(STORE_KEY)
  if (!raw) {
    return defaultStore()
  }

  try {
    const parsed = JSON.parse(raw) as MonthlySchedule[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultStore()
    }
    return Promise.all(parsed.map(hydrateSchedule))
  } catch {
    return defaultStore()
  }
}

export function persistMonthlySchedules(schedules: MonthlySchedule[]): void {
  const payload = schedules.map((schedule) => ({
    ...schedule,
    attachment: schedule.attachment
      ? { ...schedule.attachment, fileUrl: '' }
      : null,
  }))
  storage.set(STORE_KEY, JSON.stringify(payload))
}

export function serializeMonthlySchedules(schedules: MonthlySchedule[]): MonthlySchedule[] {
  return schedules
}

export type { ImportMonthlyScheduleInput, UpdateMonthlyDayInput, SwapMonthlyDaysInput }
