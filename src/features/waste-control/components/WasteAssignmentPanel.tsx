import { ClipboardCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, TextArea } from '@/components/ui'
import {
  ResponsiblePickerDialog,
  WASTE_CONFERENCE_STATUS_LABELS,
  WASTE_CONFERENCE_STATUS_STYLES,
  useAssignableEmployees,
} from '@/features/assignment'
import type { AssignableEmployee } from '@/features/assignment'
import { WASTE_CONTROL_SECTOR_ASSIGNMENT } from '@/features/waste-control/constants/wasteSectors'
import type {
  WasteConferenceStatus,
  WasteControlDay,
  WasteControlSector,
} from '@/features/waste-control/types/wasteControl.types'
import { formatDateTimeBr } from '@/utils/formatDate'
import { cn } from '@/utils/cn'

export interface WasteAssignmentPanelProps {
  date: string
  sector: WasteControlSector
  day: WasteControlDay | undefined
  canConference: boolean
  onAssign: (employee: AssignableEmployee) => Promise<void>
  onConference: (status: WasteConferenceStatus, notes: string) => Promise<void>
  isAssigning?: boolean
  isConferencing?: boolean
  pickerOpen: boolean
  onPickerOpenChange: (open: boolean) => void
  readOnly?: boolean
}

const CONFERENCE_OPTIONS: WasteConferenceStatus[] = [
  'conferido',
  'necessita_revisao',
  'aguardando_conferencia',
]

export function WasteAssignmentPanel({
  date,
  sector,
  day,
  canConference,
  onAssign,
  onConference,
  isAssigning = false,
  isConferencing = false,
  pickerOpen,
  onPickerOpenChange,
  readOnly = false,
}: WasteAssignmentPanelProps) {
  const assignmentSector = WASTE_CONTROL_SECTOR_ASSIGNMENT[sector]
  const [notes, setNotes] = useState(day?.conference?.notes ?? '')
  const { candidates, isLoading } = useAssignableEmployees(date, assignmentSector)
  const assignment = day?.assignment
  const conference = day?.conference
  const closing = day?.closing
  const finalized = day?.status === 'FINALIZED' || Boolean(closing)

  return (
    <section className="min-w-0 max-w-full space-y-3 rounded-2xl border border-border bg-card/80 p-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-full flex-1">
          <h3 className="flex items-center gap-2 font-medium text-foreground">
            <UserRound className="size-4 shrink-0" />
            Responsável pela contagem (opcional)
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Somente colaboradores ativos deste setor. Folga, férias e afastamento não entram quando a
            escala estiver disponível.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          disabled={isAssigning || readOnly || finalized}
          onClick={() => onPickerOpenChange(true)}
        >
          {assignment ? 'Trocar responsável' : 'Selecionar responsável'}
        </Button>
      </div>

      {assignment ? (
        <div className="min-w-0 rounded-xl border border-border bg-background/70 p-3 text-sm">
          <p className="min-w-0 break-words font-medium text-foreground">
            {assignment.responsibleEmployeeName}
          </p>
          <p className="text-muted-foreground">
            {assignment.responsiblePosition} · {assignment.responsibleShift}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Atribuído em {formatDateTimeBr(assignment.assignedAt)} por {assignment.assignedByName}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhum responsável selecionado ainda. Você pode registrar a contagem normalmente e
          indicar o responsável quando quiser — obrigatório apenas para finalizar.
        </p>
      )}

      {closing ? (
        <div className="rounded-xl border border-border bg-background/70 p-3 text-sm">
          <p className="font-medium text-foreground">Fechamento registrado</p>
          <p className="text-xs text-muted-foreground">
            {formatDateTimeBr(closing.closedAt)} · {closing.closedByName}
          </p>
        </div>
      ) : null}

      {conference ? (
        <div className="space-y-3 rounded-xl border border-border bg-background/70 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <ClipboardCheck className="size-4 text-muted-foreground" />
            <span
              className={cn(
                'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
                WASTE_CONFERENCE_STATUS_STYLES[conference.status],
              )}
            >
              {WASTE_CONFERENCE_STATUS_LABELS[conference.status]}
            </span>
            {conference.checkedByName ? (
              <Badge variant="muted">
                {conference.checkedByName}
                {conference.checkedAt ? ` · ${formatDateTimeBr(conference.checkedAt)}` : ''}
              </Badge>
            ) : null}
          </div>
          {conference.notes ? (
            <p className="text-xs text-muted-foreground">Obs.: {conference.notes}</p>
          ) : null}

          {canConference && finalized ? (
            <div className="space-y-2 border-t border-border pt-3">
              <TextArea
                label="Observações da conferência"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
              />
              <div className="flex flex-wrap gap-2">
                {CONFERENCE_OPTIONS.map((status) => (
                  <Button
                    key={status}
                    type="button"
                    size="sm"
                    variant={conference.status === status ? 'secondary' : 'outline'}
                    disabled={isConferencing}
                    onClick={() => void onConference(status, notes)}
                  >
                    {WASTE_CONFERENCE_STATUS_LABELS[status]}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <ResponsiblePickerDialog
        open={pickerOpen}
        sector={assignmentSector}
        candidates={candidates}
        isLoading={isLoading}
        onClose={() => onPickerOpenChange(false)}
        onConfirm={(employee) => {
          void onAssign(employee).then(() => onPickerOpenChange(false))
        }}
      />
    </section>
  )
}
