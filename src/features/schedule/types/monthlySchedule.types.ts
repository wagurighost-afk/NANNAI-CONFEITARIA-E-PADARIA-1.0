export type MonthlyDayStatus = 'work' | 'off' | 'vacation' | 'leave' | 'other'

export interface MonthlyScheduleDay {
  day: number
  status: MonthlyDayStatus
  note?: string
}

export interface MonthlyScheduleRow {
  id: string
  employeeId: string | null
  employeeName: string
  position: string
  shift: string
  shiftCode: string
  days: MonthlyScheduleDay[]
}

export interface MonthlyScheduleAttachment {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  kind: 'pdf' | 'excel' | 'word'
  fileUrl: string
  uploadedAt: string
}

export interface MonthlySchedule {
  id: string
  year: number
  month: number
  label: string
  daysInMonth: number
  weekdayLabels: string[]
  rows: MonthlyScheduleRow[]
  attachment: MonthlyScheduleAttachment | null
  updatedAt: string
}

export interface CreateMonthlyScheduleInput {
  year: number
  month: number
  copyPrevious?: boolean
}
export interface UpdateMonthlyDayInput {
  scheduleId: string
  rowId: string
  day: number
  status: MonthlyDayStatus
}

export interface SwapMonthlyDaysInput {
  scheduleId: string
  sourceRowId: string
  sourceDay: number
  targetRowId: string
  targetDay: number
}

export interface ImportMonthlyScheduleInput {
  year: number
  month: number
  label: string
  daysInMonth: number
  weekdayLabels: string[]
  rows: Omit<MonthlyScheduleRow, 'id'>[]
  attachment?: MonthlyScheduleAttachment | null
}
