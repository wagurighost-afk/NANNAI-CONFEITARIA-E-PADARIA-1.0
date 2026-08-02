import { useState } from 'react'
import { Button, Input, Modal, Select } from '@/components/ui'
import { getAppTodayIso } from '@/core/constants/appDate'
import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'
import { EMPLOYEE_SHIFTS, PRODUCTION_SECTORS } from '@/features/employees/types/employee.types'
import type { EmployeeShift, ProductionSector } from '@/features/employees/types/employee.types'
import type { Recipe } from '@/features/recipes/types/recipe.types'

const EMPLOYEE_OPTIONS = EMPLOYEES_MOCK.filter((employee) => employee.status === 'Ativo').map((employee) => ({
  value: employee.id,
  label: employee.name,
}))

const SHIFT_OPTIONS = EMPLOYEE_SHIFTS.map((shift) => ({ value: shift, label: shift }))
const SECTOR_OPTIONS = PRODUCTION_SECTORS.map((sector) => ({ value: sector, label: sector }))

export interface SendRecipesToProductionInput {
  date: string
  shift: EmployeeShift
  sector: ProductionSector
  employeeId: string
  appendToExisting: boolean
}

export interface SendRecipesToProductionDialogProps {
  open: boolean
  recipes: Recipe[]
  onClose: () => void
  onConfirm: (input: SendRecipesToProductionInput) => Promise<void>
  isLoading?: boolean
}

export function SendRecipesToProductionDialog({
  open,
  recipes,
  onClose,
  onConfirm,
  isLoading = false,
}: SendRecipesToProductionDialogProps) {
  const [date, setDate] = useState(getAppTodayIso())
  const [shift, setShift] = useState<EmployeeShift>('Manhã')
  const [sector, setSector] = useState<ProductionSector>('Confeitaria')
  const [employeeId, setEmployeeId] = useState('')
  const [appendToExisting, setAppendToExisting] = useState(true)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enviar receitas para produção"
      description={`${recipes.length} receita(s) selecionada(s) serão adicionadas à produção do dia.`}
      size="md"
    >
      <div className="space-y-4">
        <Input
          label="Data"
          type="date"
          value={date}
          onChange={(event) => {
            setDate(event.target.value)
          }}
        />
        <Select
          label="Turno"
          options={SHIFT_OPTIONS}
          value={shift}
          onChange={(event) => {
            setShift(event.target.value as EmployeeShift)
          }}
        />
        <Select
          label="Setor"
          options={SECTOR_OPTIONS}
          value={sector}
          onChange={(event) => {
            setSector(event.target.value as ProductionSector)
          }}
        />
        <Select
          label="Responsável"
          options={[{ value: '', label: 'Selecione...' }, ...EMPLOYEE_OPTIONS]}
          value={employeeId}
          onChange={(event) => {
            setEmployeeId(event.target.value)
          }}
        />
        <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={appendToExisting}
            onChange={(event) => {
              setAppendToExisting(event.target.checked)
            }}
          />
          <span>
            <span className="font-medium text-foreground">Adicionar à produção existente</span>
            <span className="mt-1 block text-muted-foreground">
              Se já houver produção para este colaborador no dia, as receitas serão incluídas nela.
            </span>
          </span>
        </label>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="button"
            isLoading={isLoading}
            disabled={!employeeId || recipes.length === 0}
            onClick={async () => {
              await onConfirm({
                date,
                shift,
                sector,
                employeeId,
                appendToExisting,
              })
              onClose()
            }}
          >
            Enviar para produção
          </Button>
        </div>
      </div>
    </Modal>
  )
}
