import { useMemo, useState } from 'react'
import { Button, Modal } from '@/components/ui'
import { AssignableEmployeeCard } from '@/features/assignment/components/AssignableEmployeeCard'
import { ASSIGNMENT_SECTOR_LABELS } from '@/features/assignment/constants/assignment.constants'
import type {
  AssignableEmployee,
  AssignmentSector,
} from '@/features/assignment/types/assignment.types'

export interface ResponsiblePickerDialogProps {
  open: boolean
  sector: AssignmentSector
  candidates: AssignableEmployee[]
  isLoading?: boolean
  onClose: () => void
  onConfirm: (employee: AssignableEmployee) => void
}

export function ResponsiblePickerDialog({
  open,
  sector,
  candidates,
  isLoading = false,
  onClose,
  onConfirm,
}: ResponsiblePickerDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectable = useMemo(
    () => candidates.filter((item) => item.selectable),
    [candidates],
  )
  const selected = candidates.find((item) => item.employeeId === selectedId) ?? null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Selecionar responsável"
      description={`Abertura da contagem — ${ASSIGNMENT_SECTOR_LABELS[sector]}. Somente colaboradores presentes.`}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!selected?.selectable}
            onClick={() => {
              if (selected?.selectable) {
                onConfirm(selected)
              }
            }}
          >
            Confirmar responsável
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando escala…</p>
      ) : selectable.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          Não há responsáveis disponíveis para este setor no dia selecionado.
          Verifique a Escala Mensal e a Escala Diária (presentes apenas).
        </div>
      ) : (
        <ul className="grid max-h-[50vh] gap-2 overflow-y-auto sm:grid-cols-2">
          {candidates.map((employee) => (
            <li key={employee.employeeId}>
              <AssignableEmployeeCard
                employee={employee}
                selected={selectedId === employee.employeeId}
                onSelect={(item) => setSelectedId(item.employeeId)}
              />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
