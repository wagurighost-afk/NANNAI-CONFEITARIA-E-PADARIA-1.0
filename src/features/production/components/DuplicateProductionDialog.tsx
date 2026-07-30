import { Button, Input, Modal, Select } from '@/components/ui'
import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'
import { EMPLOYEE_SHIFTS } from '@/features/employees/types/employee.types'
import type { ProductionDay } from '@/features/production/types/production.types'
import type { EmployeeShift } from '@/features/employees/types/employee.types'
import { useState } from 'react'

export interface DuplicateProductionDialogProps {
  production: ProductionDay | null
  open: boolean
  onClose: () => void
  onConfirm: (input: {
    targetDate: string
    targetShift?: EmployeeShift
    targetEmployeeId?: string
  }) => Promise<void>
  isLoading?: boolean
}

export function DuplicateProductionDialog({
  production,
  open,
  onClose,
  onConfirm,
  isLoading = false,
}: DuplicateProductionDialogProps) {
  const [targetDate, setTargetDate] = useState('')
  const [targetShift, setTargetShift] = useState<EmployeeShift | ''>('')
  const [targetEmployeeId, setTargetEmployeeId] = useState('')

  if (!production) {
    return null
  }

  const employeeOptions = [
    { value: '', label: 'Mesmo responsável' },
    ...EMPLOYEES_MOCK.filter((e) => e.status === 'Ativo').map((e) => ({
      value: e.id,
      label: e.name,
    })),
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Duplicar produção"
      description={`Copiar itens de ${production.employeeName} para outro dia.`}
    >
      <div className="space-y-4">
        <Input
          label="Data de destino"
          type="date"
          value={targetDate}
          onChange={(event) => {
            setTargetDate(event.target.value)
          }}
        />
        <Select
          label="Turno (opcional)"
          options={[{ value: '', label: 'Mesmo turno' }, ...EMPLOYEE_SHIFTS.map((s) => ({ value: s, label: s }))]}
          value={targetShift}
          onChange={(event) => {
            setTargetShift(event.target.value as EmployeeShift | '')
          }}
        />
        <Select
          label="Responsável (opcional)"
          options={employeeOptions}
          value={targetEmployeeId}
          onChange={(event) => {
            setTargetEmployeeId(event.target.value)
          }}
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="button"
            isLoading={isLoading}
            disabled={!targetDate}
            onClick={async () => {
              await onConfirm({
                targetDate,
                ...(targetShift ? { targetShift } : {}),
                ...(targetEmployeeId ? { targetEmployeeId } : {}),
              })
              onClose()
            }}
          >
            Duplicar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
