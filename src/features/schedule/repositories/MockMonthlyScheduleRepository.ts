import { JULY_2026_MONTHLY_SCHEDULE } from '@/features/schedule/mocks/monthlySchedule.mock'
import type { MonthlyScheduleRepository } from '@/features/schedule/repositories/MonthlyScheduleRepository'
import {
  loadPersistedMonthlySchedules,
  persistMonthlySchedules,
} from '@/features/schedule/storage/monthlySchedulePersistence'
import type {
  ImportMonthlyScheduleInput,
  MonthlyDayStatus,
  MonthlySchedule,
  MonthlyScheduleRow,
  SwapMonthlyDaysInput,
  UpdateMonthlyDayInput,
} from '@/features/schedule/types/monthlySchedule.types'
import { matchEmployeeIdByScheduleName } from '@/features/schedule/utils/matchScheduleEmployee'
import { MONTHLY_DAY_STATUS_LABELS } from '@/features/schedule/utils/parseMonthlyScheduleExcel'

function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

let store: MonthlySchedule[] = [structuredClone(JULY_2026_MONTHLY_SCHEDULE)]
let storeReady: Promise<void> = loadPersistedMonthlySchedules()
  .then((schedules) => {
    store = schedules
  })
  .catch(() => {
    store = [structuredClone(JULY_2026_MONTHLY_SCHEDULE)]
  })

async function ensureStore(): Promise<void> {
  await storeReady
}

function saveStore(): void {
  persistMonthlySchedules(store)
}

function scheduleKey(year: number, month: number): string {
  return `ms-${year}-${String(month).padStart(2, '0')}`
}

function nextDayStatus(current: MonthlyDayStatus): MonthlyDayStatus {
  const order: MonthlyDayStatus[] = ['work', 'off', 'vacation', 'leave', 'other']
  const index = order.indexOf(current)
  return order[(index + 1) % order.length] ?? 'work'
}

function mapImportRows(rows: ImportMonthlyScheduleInput['rows']): MonthlyScheduleRow[] {
  return rows.map((row) => ({
    id: `msr-${crypto.randomUUID()}`,
    employeeId: row.employeeId ?? matchEmployeeIdByScheduleName(row.employeeName),
    employeeName: row.employeeName,
    position: row.position,
    shift: row.shift,
    shiftCode: row.shiftCode,
    days: row.days,
  }))
}

export class MockMonthlyScheduleRepository implements MonthlyScheduleRepository {
  async list(): Promise<MonthlySchedule[]> {
    await ensureStore()
    await delay()
    return [...store].sort((a, b) => b.year - a.year || b.month - a.month)
  }

  async getByYearMonth(year: number, month: number): Promise<MonthlySchedule | null> {
    await ensureStore()
    await delay()
    return store.find((schedule) => schedule.year === year && schedule.month === month) ?? null
  }

  async getById(id: string): Promise<MonthlySchedule | null> {
    await ensureStore()
    await delay()
    return store.find((schedule) => schedule.id === id) ?? null
  }

  async importSchedule(input: ImportMonthlyScheduleInput): Promise<MonthlySchedule> {
    await ensureStore()
    await delay()

    const id = scheduleKey(input.year, input.month)
    const now = new Date().toISOString()
    const schedule: MonthlySchedule = {
      id,
      year: input.year,
      month: input.month,
      label: input.label,
      daysInMonth: input.daysInMonth,
      weekdayLabels: input.weekdayLabels,
      rows: mapImportRows(input.rows),
      attachment: input.attachment ?? null,
      updatedAt: now,
    }

    const index = store.findIndex((item) => item.id === id)
    if (index === -1) {
      store = [schedule, ...store]
    } else {
      store[index] = schedule
    }

    saveStore()
    return schedule
  }

  async updateDay(input: UpdateMonthlyDayInput): Promise<MonthlySchedule> {
    await ensureStore()
    await delay()

    const scheduleIndex = store.findIndex((schedule) => schedule.id === input.scheduleId)
    if (scheduleIndex === -1) {
      throw new Error('Escala mensal não encontrada.')
    }

    const schedule = store[scheduleIndex]
    if (!schedule) {
      throw new Error('Escala mensal não encontrada.')
    }

    const rowIndex = schedule.rows.findIndex((row) => row.id === input.rowId)
    if (rowIndex === -1) {
      throw new Error('Colaborador não encontrado na escala.')
    }

    const row = schedule.rows[rowIndex]
    if (!row) {
      throw new Error('Colaborador não encontrado na escala.')
    }

    const dayIndex = row.days.findIndex((day) => day.day === input.day)
    if (dayIndex === -1) {
      throw new Error('Dia inválido na escala.')
    }

    const currentDay = row.days[dayIndex]
    if (!currentDay) {
      throw new Error('Dia inválido na escala.')
    }

    row.days[dayIndex] =
      input.status === 'work'
        ? { day: currentDay.day, status: 'work' }
        : {
            day: currentDay.day,
            status: input.status,
            note:
              input.status === 'off'
                ? 'X'
                : currentDay.note || MONTHLY_DAY_STATUS_LABELS[input.status],
          }

    schedule.updatedAt = new Date().toISOString()
    store[scheduleIndex] = { ...schedule }
    saveStore()
    return schedule
  }

  async swapDays(input: SwapMonthlyDaysInput): Promise<MonthlySchedule> {
    await ensureStore()
    await delay()

    const scheduleIndex = store.findIndex((schedule) => schedule.id === input.scheduleId)
    if (scheduleIndex === -1) {
      throw new Error('Escala mensal não encontrada.')
    }

    const schedule = store[scheduleIndex]
    if (!schedule) {
      throw new Error('Escala mensal não encontrada.')
    }

    const sourceRow = schedule.rows.find((row) => row.id === input.sourceRowId)
    const targetRow = schedule.rows.find((row) => row.id === input.targetRowId)
    if (!sourceRow || !targetRow) {
      throw new Error('Colaborador não encontrado na escala.')
    }

    const sourceDayIndex = sourceRow.days.findIndex((day) => day.day === input.sourceDay)
    const targetDayIndex = targetRow.days.findIndex((day) => day.day === input.targetDay)
    if (sourceDayIndex === -1 || targetDayIndex === -1) {
      throw new Error('Dia inválido na escala.')
    }

    const sourceDay = sourceRow.days[sourceDayIndex]
    const targetDay = targetRow.days[targetDayIndex]
    if (!sourceDay || !targetDay) {
      throw new Error('Dia inválido na escala.')
    }

    sourceRow.days[sourceDayIndex] = { ...targetDay, day: sourceDay.day }
    targetRow.days[targetDayIndex] = { ...sourceDay, day: targetDay.day }

    schedule.updatedAt = new Date().toISOString()
    store[scheduleIndex] = { ...schedule }
    saveStore()
    return schedule
  }

  async toggleDay(scheduleId: string, rowId: string, day: number): Promise<MonthlySchedule> {
    await ensureStore()
    const schedule = store.find((item) => item.id === scheduleId)
    const row = schedule?.rows.find((item) => item.id === rowId)
    const dayCell = row?.days.find((item) => item.day === day)
    if (!schedule || !dayCell) {
      throw new Error('Dia inválido na escala.')
    }

    return this.updateDay({
      scheduleId,
      rowId,
      day,
      status: nextDayStatus(dayCell.status),
    })
  }
}

export const monthlyScheduleRepository = new MockMonthlyScheduleRepository()
