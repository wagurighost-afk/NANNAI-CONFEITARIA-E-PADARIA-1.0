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

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  const monthOptions = monthNames.map((label, index) => ({
    value: String(index + 1),
    label,
  }))

  const existingYears = availableMonths.map((item) => item.year)
  const minYear = Math.min(year - 2, ...existingYears)
  const maxYear = Math.max(year + 2, ...existingYears)

  const yearOptions = Array.from(
    { length: maxYear - minYear + 1 },
    (_, index) => {
      const optionYear = minYear + index

      return {
        value: String(optionYear),
        label: String(optionYear),
      }
    },
  )

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
      <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <Select
          label="Mês"
          options={monthOptions}
          value={String(month)}
          onChange={(event) => setMonth(Number(event.target.value))}
        />

        <Select
          label="Ano"
          options={yearOptions}
          value={String(year)}
          onChange={(event) => setYear(Number(event.target.value))}
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
        <EmptyState title={`Nenhuma escala cadastrada para ${formatMonthYear(year, month)}.`} />
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
