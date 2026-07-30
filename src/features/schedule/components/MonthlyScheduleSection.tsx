import { ExternalLink } from 'lucide-react'
import { EmptyState } from '@/components/common'
import { Button, Select, Skeleton } from '@/components/ui'
import { EmployeeDaysOffPanel } from '@/features/schedule/components/EmployeeDaysOffPanel'
import { MonthlyScheduleGrid } from '@/features/schedule/components/MonthlyScheduleGrid'
import { MonthlyScheduleUpload } from '@/features/schedule/components/MonthlyScheduleUpload'
import { formatMonthYear, useMonthlySchedule } from '@/features/schedule/hooks/useMonthlySchedule'
import { resolveScheduleAttachmentUrl } from '@/features/schedule/storage/scheduleAttachmentBlobStore'
import { useToast } from '@/hooks'
import { getErrorMessage } from '@/core/errors'

export interface MonthlyScheduleSectionProps {
  canManage: boolean
  highlightEmployeeId?: string | null
}

export function MonthlyScheduleSection({
  canManage,
  highlightEmployeeId = null,
}: MonthlyScheduleSectionProps) {
  const { push } = useToast()
  const {
    schedule,
    availableMonths,
    year,
    month,
    setYear,
    setMonth,
    isLoading,
    importSchedule,
    isImporting,
    toggleDay,
    isToggling,
    swapSource,
    setSwapSource,
    swapMode,
    setSwapMode,
    swapDays,
    isSwapping,
  } = useMonthlySchedule()

  const monthOptions =
    availableMonths.length > 0
      ? availableMonths.map((item) => ({
          value: `${item.year}-${item.month}`,
          label: item.label || formatMonthYear(item.year, item.month),
        }))
      : [{ value: `${year}-${month}`, label: formatMonthYear(year, month) }]

  const handleMonthChange = (value: string) => {
    const [nextYear, nextMonth] = value.split('-').map(Number)
    if (nextYear && nextMonth) {
      setYear(nextYear)
      setMonth(nextMonth)
    }
  }

  const openAttachment = async () => {
    if (!schedule?.attachment) {
      return
    }
    const url = await resolveScheduleAttachmentUrl(
      schedule.attachment.id,
      schedule.attachment.fileUrl,
    )
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Select
          label="Escala do mês"
          options={monthOptions}
          value={`${year}-${month}`}
          onChange={(event) => handleMonthChange(event.target.value)}
        />
        {schedule?.attachment ? (
          <Button type="button" variant="outline" onClick={() => void openAttachment()}>
            <ExternalLink className="size-4" />
            Ver documento
          </Button>
        ) : null}
      </div>

      {canManage ? (
        <MonthlyScheduleUpload
          disabled={isImporting}
          onUpload={async (file) => {
            try {
              await importSchedule(file)
              push({ title: 'Escala importada', variant: 'success' })
            } catch (error: unknown) {
              push({ title: 'Erro', description: getErrorMessage(error), variant: 'danger' })
              throw error
            }
          }}
        />
      ) : null}

      {isLoading ? (
        <Skeleton variant="rectangular" height={360} />
      ) : !schedule ? (
        <EmptyState title="Nenhuma escala para este mês" />
      ) : (
        <>
          {highlightEmployeeId ? (
            <EmployeeDaysOffPanel
              schedule={schedule}
              employeeId={highlightEmployeeId}
              employeeName={
                schedule.rows.find((row) => row.employeeId === highlightEmployeeId)?.employeeName ??
                'Colaborador'
              }
            />
          ) : null}

          <MonthlyScheduleGrid
            schedule={schedule}
            canManage={canManage}
            swapMode={swapMode}
            swapSource={swapSource}
            onToggleSwapMode={() => {
              setSwapMode((current) => !current)
              setSwapSource(null)
            }}
            onSelectSwapSource={setSwapSource}
            onToggleDay={async (rowId, day) => {
              try {
                await toggleDay({ scheduleId: schedule.id, rowId, day })
              } catch (error: unknown) {
                push({ title: 'Erro', description: getErrorMessage(error), variant: 'danger' })
              }
            }}
            onSwapDays={async (source, target) => {
              try {
                await swapDays({
                  scheduleId: schedule.id,
                  sourceRowId: source.rowId,
                  sourceDay: source.day,
                  targetRowId: target.rowId,
                  targetDay: target.day,
                })
                push({ title: 'Dias trocados', variant: 'success' })
              } catch (error: unknown) {
                push({ title: 'Erro', description: getErrorMessage(error), variant: 'danger' })
              }
            }}
            isBusy={isToggling || isSwapping}
          />
        </>
      )}
    </div>
  )
}
