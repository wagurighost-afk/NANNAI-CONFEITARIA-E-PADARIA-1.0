import { ArrowLeftRight } from 'lucide-react'
import { Badge } from '@/components/ui'
import type { MonthlySchedule } from '@/features/schedule/types/monthlySchedule.types'
import {
  MONTHLY_DAY_STATUS_CLASSES,
  MONTHLY_DAY_STATUS_LABELS,
} from '@/features/schedule/utils/parseMonthlyScheduleExcel'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'

export interface MonthlyScheduleGridProps {
  schedule: MonthlySchedule
  canManage: boolean
  swapMode: boolean
  swapSource: { rowId: string; day: number } | null
  onToggleSwapMode: () => void
  onSelectSwapSource: (source: { rowId: string; day: number } | null) => void
  onToggleDay: (rowId: string, day: number) => void
  onSwapDays: (source: { rowId: string; day: number }, target: { rowId: string; day: number }) => void
  isBusy?: boolean
}

function cellLabel(status: MonthlySchedule['rows'][number]['days'][number]['status'], note?: string): string {
  if (status === 'off') {
    return 'X'
  }
  if (status === 'work') {
    return ''
  }
  if (note) {
    return note.slice(0, 3).toUpperCase()
  }
  return MONTHLY_DAY_STATUS_LABELS[status].slice(0, 3).toUpperCase()
}

export function MonthlyScheduleGrid({
  schedule,
  canManage,
  swapMode,
  swapSource,
  onToggleSwapMode,
  onSelectSwapSource,
  onToggleDay,
  onSwapDays,
  isBusy = false,
}: MonthlyScheduleGridProps) {
  const handleCellClick = (
    rowId: string,
    day: number,
    isAbsenceDerived = false,
  ) => {
    if (isAbsenceDerived || !canManage || isBusy) {
      return
    }

    if (swapMode) {
      if (!swapSource) {
        onSelectSwapSource({ rowId, day })
        return
      }

      if (swapSource.rowId === rowId && swapSource.day === day) {
        onSelectSwapSource(null)
        return
      }

      onSwapDays(swapSource, { rowId, day })
      return
    }

    onToggleDay(rowId, day)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-lg text-foreground">{schedule.label}</p>
          <p className="text-xs text-muted-foreground">
            {schedule.rows.length} colaboradores · {schedule.daysInMonth} dias
          </p>
        </div>
        {canManage ? (
          <Button
            type="button"
            size="sm"
            variant={swapMode ? 'primary' : 'outline'}
            disabled={isBusy}
            onClick={onToggleSwapMode}
          >
            <ArrowLeftRight className="size-4" />
            {swapMode ? 'Cancelar troca' : 'Trocar dias'}
          </Button>
        ) : null}
      </div>

      {canManage ? (
        <p className="text-xs text-muted-foreground">
          {swapMode
            ? swapSource
              ? 'Agora clique no segundo dia para concluir a troca.'
              : 'Clique no primeiro dia que deseja trocar.'
            : 'Clique em um dia para alternar entre trabalho e folga. Férias e afastamentos vêm dos períodos oficiais.'}
        </p>
      ) : null}

      <div className="overflow-auto rounded-xl border border-border bg-[#f6f1ea]">
        <table className="min-w-max border-collapse text-[11px]">
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 min-w-[180px] border border-border bg-muted px-3 py-2 text-left font-semibold">
                Colaborador
              </th>
              <th className="min-w-[90px] border border-border bg-muted px-2 py-2 text-left font-semibold">
                Turno
              </th>
              {Array.from({ length: schedule.daysInMonth }, (_, index) => {
                const day = index + 1
                const weekday = schedule.weekdayLabels[index] ?? ''
                return (
                  <th
                    key={day}
                    className="min-w-[34px] border border-border bg-muted px-1 py-2 text-center font-semibold"
                  >
                    <div>{day}</div>
                    <div className="text-[9px] font-normal text-muted-foreground">{weekday}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {schedule.rows.map((row) => (
              <tr key={row.id} className="bg-surface">
                <td className="sticky left-0 z-10 border border-border bg-surface-elevated px-3 py-2">
                  <p className="font-medium text-foreground">{row.employeeName}</p>
                  <p className="text-[10px] text-muted-foreground">{row.position}</p>
                </td>
                <td className="border border-border px-2 py-2 text-[10px] text-muted-foreground">
                  <div>{row.shiftCode}</div>
                  <div>{row.shift}</div>
                </td>
                {row.days.map((dayCell) => {
                  const isSelected =
                    swapSource?.rowId === row.id && swapSource.day === dayCell.day
                  const isAbsenceDerived =
                    dayCell.origin === 'absence'

                  return (
                    <td
                      key={dayCell.day}
                      className={cn(
                        'border border-border px-0.5 py-1 text-center align-middle',
                        MONTHLY_DAY_STATUS_CLASSES[dayCell.status],
                        canManage &&
                          !isAbsenceDerived &&
                          'cursor-pointer hover:ring-2 hover:ring-accent/40',
                        isAbsenceDerived && 'cursor-not-allowed',
                        isSelected && 'ring-2 ring-accent',
                      )}
                      onClick={() =>
                        handleCellClick(
                          row.id,
                          dayCell.day,
                          isAbsenceDerived,
                        )
                      }
                      title={`${isAbsenceDerived ? 'Período oficial — ' : ''}${MONTHLY_DAY_STATUS_LABELS[dayCell.status]}${dayCell.note ? ` — ${dayCell.note}` : ''}`}
                    >
                      {cellLabel(dayCell.status, dayCell.note)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(MONTHLY_DAY_STATUS_LABELS) as Array<keyof typeof MONTHLY_DAY_STATUS_LABELS>).map(
          (status) => (
            <Badge key={status} variant="muted" className={MONTHLY_DAY_STATUS_CLASSES[status]}>
              {MONTHLY_DAY_STATUS_LABELS[status]}
            </Badge>
          ),
        )}
      </div>
    </div>
  )
}
