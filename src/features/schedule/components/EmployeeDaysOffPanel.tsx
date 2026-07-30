import { Badge } from '@/components/ui'
import {
  formatMonthYear,
  getEmployeeDaysOff,
} from '@/features/schedule/hooks/useMonthlySchedule'
import type { MonthlySchedule } from '@/features/schedule/types/monthlySchedule.types'
import {
  MONTHLY_DAY_STATUS_CLASSES,
  MONTHLY_DAY_STATUS_LABELS,
} from '@/features/schedule/utils/parseMonthlyScheduleExcel'

export interface EmployeeDaysOffPanelProps {
  schedule: MonthlySchedule | null
  employeeId: string | null
  employeeName: string
}

function formatDayLabel(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(date)
}

export function EmployeeDaysOffPanel({
  schedule,
  employeeId,
  employeeName,
}: EmployeeDaysOffPanelProps) {
  const daysOff = getEmployeeDaysOff(schedule, employeeId)

  if (!schedule) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma escala mensal cadastrada para exibir as folgas de {employeeName}.
      </p>
    )
  }

  if (daysOff.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {employeeName} não possui folgas registradas em{' '}
          {formatMonthYear(schedule.year, schedule.month)}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">{formatMonthYear(schedule.year, schedule.month)}</p>
        <p className="text-xs text-muted-foreground">{schedule.label}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {daysOff.map((day) => (
          <div
            key={day.day}
            className={`rounded-xl border border-border px-3 py-2 ${MONTHLY_DAY_STATUS_CLASSES[day.status]}`}
          >
            <p className="text-sm font-medium">{formatDayLabel(schedule.year, schedule.month, day.day)}</p>
            <Badge variant="muted" className="mt-1">
              {MONTHLY_DAY_STATUS_LABELS[day.status]}
            </Badge>
            {day.note && day.status !== 'off' ? (
              <p className="mt-1 text-[11px] opacity-80">{day.note}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
