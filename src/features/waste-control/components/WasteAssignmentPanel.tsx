import { ClipboardCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, TextArea } from '@/components/ui'
import {
  ResponsiblePickerDialog,
  WASTE_CONFERENCE_STATUS_LABELS,
  WASTE_CONFERENCE_STATUS_STYLES,
  useAssignableEmployees,
} from '@/features/assignment'
import type { AssignableEmployee, AssignmentSector } from '@/features/assignment'
import type {
  WasteBuffetType,
  WasteConferenceStatus,
  WasteControlDay,
} from '@/features/waste-control/types/wasteControl.types'
import { formatDateTimeBr } from '@/utils/formatDate'
import { cn } from '@/utils/cn'

export interface WasteAssignmentPanelProps {
  date: string
  buffet: WasteBuffetType
  day: WasteControlDay | undefined
  canConference: boolean
  onAssign: (employee: AssignableEmployee) => Promise<void>
  onConference: (status: WasteConferenceStatus, notes: string) => Promise<void>
  isAssigning?: boolean
  isConferencing?: boolean
  /** Controlado pelo pai para permitir abertura automática do seletor. */
  pickerOpen: boolean
  onPickerOpenChange: (open: boolean) => void
}

const CONFERENCE_OPTIONS: WasteConferenceStatus[] = [
  'conferido',
  'necessita_revisao',
  'aguardando_conferencia',
]

export function WasteAssignmentPanel({
  date,
  buffet,
  day,
  canConference,
  onAssign,
  onConference,
  isAssigning = false,
  isConferencing = false,
  pickerOpen,
  onPickerOpenChange,
}: WasteAssignmentPanelProps) {
  const sector = buffet as AssignmentSector
  const [notes, setNotes] = useState(day?.conference?.notes ?? '')
  const { candidates, isLoading } = useAssignableEmployees(date, sector)
  const assignment = day?.assignment
  const conference = day?.conference
  const closing = day?.closing

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-medium text-foreground">
            <UserRound className="size-4" />
            Responsável pela contagem (opcional)
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Indique quem está fazendo a contagem completa (entrada, reposição e finalização) — essa
            pessoa também pode finalizar o registro. Baseado na Escala Mensal e Diária.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={isAssigning || Boolean(closing)}
          onClick={() => onPickerOpenChange(true)}
        >
          {assignment ? 'Trocar responsável' : 'Selecionar responsável'}
        </Button>
      </div>

      {assignment ? (
        <div className="rounded-xl border border-border bg-background/70 p-3 text-sm">
          <p className="font-medium text-foreground">{assignment.responsibleEmployeeName}</p>
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

          {canConference && closing ? (
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
        sector={sector}
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
