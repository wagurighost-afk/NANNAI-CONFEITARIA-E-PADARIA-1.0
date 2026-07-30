import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'
import {
  EMPLOYEE_SECTORS,
  EMPLOYEE_SHIFTS,
  EMPLOYEE_STATUSES,
} from '@/features/employees/types/employee.types'
import { Button, Select, TextArea } from '@/components/ui'
import { useScheduleForm } from '@/features/schedule/hooks/useScheduleForm'
import type { ScheduleFormSchema } from '@/features/schedule/schemas/schedule.schema'
import type { ScheduleEntry } from '@/features/schedule/types/schedule.types'

const EMPLOYEE_OPTIONS = EMPLOYEES_MOCK.map((e) => ({ value: e.id, label: e.name }))
const SECTOR_OPTIONS = EMPLOYEE_SECTORS.map((s) => ({ value: s, label: s }))
const SHIFT_OPTIONS = EMPLOYEE_SHIFTS.map((s) => ({ value: s, label: s }))
const STATUS_OPTIONS = EMPLOYEE_STATUSES.map((s) => ({ value: s, label: s }))

export function ScheduleForm({
  entry,
  onSubmit,
  onCancel,
  isSaving = false,
}: {
  entry: ScheduleEntry | null
  onSubmit: (values: ScheduleFormSchema) => Promise<void>
  onCancel: () => void
  isSaving?: boolean
}) {
  const { form, handleSubmit, isSubmitting } = useScheduleForm({ entry, onSubmit })
  const {
    register,
    formState: { errors },
  } = form

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <Select
        label="Colaborador"
        options={[{ value: '', label: 'Selecione...' }, ...EMPLOYEE_OPTIONS]}
        error={errors.employeeId?.message}
        disabled={Boolean(entry)}
        {...register('employeeId')}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Setor" options={SECTOR_OPTIONS} error={errors.sector?.message} {...register('sector')} />
        <Select label="Turno" options={SHIFT_OPTIONS} error={errors.shift?.message} {...register('shift')} />
        <Select label="Status" options={STATUS_OPTIONS} error={errors.status?.message} {...register('status')} />
      </div>
      <TextArea label="Observações" rows={3} error={errors.notes?.message} {...register('notes')} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || isSaving}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting || isSaving}>
          {entry ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}
