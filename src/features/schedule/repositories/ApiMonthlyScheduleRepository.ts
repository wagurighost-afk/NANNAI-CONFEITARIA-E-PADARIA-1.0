import { apiClient } from '@/core/api/apiClient'
import type { MonthlyScheduleRepository } from '@/features/schedule/repositories/MonthlyScheduleRepository'
import type {
  CreateMonthlyScheduleInput,
  ImportMonthlyScheduleInput,
  MonthlySchedule,
  MonthlyScheduleAttachment,
  SwapMonthlyDaysInput,
  UpdateMonthlyDayInput,
} from '@/features/schedule/types/monthlySchedule.types'

function mapAttachment(attachment: MonthlyScheduleAttachment | null): MonthlyScheduleAttachment | null {
  if (!attachment) {
    return null
  }

  return {
    ...attachment,
    fileUrl: attachment.fileUrl.startsWith('http')
      ? attachment.fileUrl
      : `${window.location.origin}${attachment.fileUrl}`,
  }
}

function mapSchedule(schedule: MonthlySchedule): MonthlySchedule {
  return {
    ...schedule,
    attachment: mapAttachment(schedule.attachment),
  }
}

export class ApiMonthlyScheduleRepository implements MonthlyScheduleRepository {
  async list(): Promise<MonthlySchedule[]> {
    const { data } = await apiClient.get<MonthlySchedule[]>('/monthly-schedules')
    return data.map(mapSchedule)
  }

  async getByYearMonth(year: number, month: number): Promise<MonthlySchedule | null> {
    try {
      const { data } = await apiClient.get<MonthlySchedule>('/monthly-schedules/by-date', {
        params: { year, month },
      })
      return mapSchedule(data)
    } catch {
      return null
    }
  }

  async getById(id: string): Promise<MonthlySchedule | null> {
    try {
      const { data } = await apiClient.get<MonthlySchedule>(`/monthly-schedules/${id}`)
      return mapSchedule(data)
    } catch {
      return null
    }
  }

  async createSchedule(input: CreateMonthlyScheduleInput): Promise<MonthlySchedule> {
    const { data } = await apiClient.post<MonthlySchedule>('/monthly-schedules/create', input)
    return mapSchedule(data)
  }
  async importSchedule(input: ImportMonthlyScheduleInput, file?: File): Promise<MonthlySchedule> {
    const formData = new FormData()
    formData.append('data', JSON.stringify(input))
    if (file) {
      formData.append('file', file)
    }

    const { data } = await apiClient.post<MonthlySchedule>('/monthly-schedules/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return mapSchedule(data)
  }

  async updateDay(input: UpdateMonthlyDayInput): Promise<MonthlySchedule> {
    const { data } = await apiClient.patch<MonthlySchedule>(
      `/monthly-schedules/${input.scheduleId}/day`,
      input,
    )
    return mapSchedule(data)
  }

  async swapDays(input: SwapMonthlyDaysInput): Promise<MonthlySchedule> {
    const { data } = await apiClient.patch<MonthlySchedule>(
      `/monthly-schedules/${input.scheduleId}/swap`,
      input,
    )
    return mapSchedule(data)
  }

  async toggleDay(scheduleId: string, rowId: string, day: number): Promise<MonthlySchedule> {
    const { data } = await apiClient.patch<MonthlySchedule>(`/monthly-schedules/${scheduleId}/toggle`, {
      rowId,
      day,
    })
    return mapSchedule(data)
  }
}
