import { ClipboardCheck, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
  /** Força abertura do seletor (ex.: ao tentar finalizar sem responsável). */
  forceOpenPicker?: boolean
  onPickerOpenChange?: (open: boolean) => void
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
  forceOpenPicker = false,
  onPickerOpenChange,
}: WasteAssignmentPanelProps) {
  const sector = buffet as AssignmentSector
  const [pickerOpen, setPickerOpen] = useState(false)
  const [notes, setNotes] = useState(day?.conference?.notes ?? '')
  const { candidates, isLoading } = useAssignableEmployees(date, sector)
  const assignment = day?.assignment
  const conference = day?.conference
  const closing = day?.closing
  const autoOpenedKeyRef = useRef<string | null>(null)
  const contextKey = `${date}|${buffet}`

  const openPicker = () => {
    if (closing) {
      return
    }
    setPickerOpen(true)
    onPickerOpenChange?.(true)
  }

  const closePicker = () => {
    setPickerOpen(false)
    onPickerOpenChange?.(false)
  }

  // Abre automaticamente uma vez ao iniciar a contagem sem responsável.
  useEffect(() => {
    if (!day || assignment || closing || isLoading) {
      return
    }
    if (autoOpenedKeyRef.current === contextKey) {
      return
    }
    autoOpenedKeyRef.current = contextKey
    openPicker()
    // openPicker é estável o suficiente para este fluxo controlado por contextKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita reabrir a cada render do pai
  }, [contextKey, day, assignment, closing, isLoading])

  useEffect(() => {
    if (forceOpenPicker && !closing) {
      openPicker()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- forceOpenPicker é o gatilho externo
  }, [forceOpenPicker, closing])

  useEffect(() => {
    setNotes(day?.conference?.notes ?? '')
  }, [day?.conference?.notes])

  return (
    <section className="space-y-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-medium text-foreground">
            <UserRound className="size-4" />
            Responsável da contagem
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Escolha quem está presente na Escala Mensal/Diária antes de registrar o buffet.
          </p>
        </div>
        <Button
          type="button"
          variant={assignment ? 'secondary' : 'primary'}
          disabled={isAssigning || Boolean(closing)}
          onClick={openPicker}
          className="w-full sm:w-auto"
        >
          {assignment ? 'Trocar responsável' : 'Selecionar funcionário'}
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
        <button
          type="button"
          onClick={openPicker}
          className="w-full rounded-xl border border-dashed border-amber-300 bg-background/80 px-3 py-3 text-left text-sm text-amber-950 transition hover:border-amber-400 hover:bg-background dark:border-amber-800 dark:text-amber-100"
        >
          Nenhum responsável selecionado. Toque aqui para escolher o funcionário presente.
        </button>
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
        onClose={closePicker}
        onConfirm={(employee) => {
          void onAssign(employee).then(() => closePicker())
        }}
      />
    </section>
  )
}
