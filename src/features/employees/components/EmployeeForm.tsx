import { Button, Input, Select, TextArea } from '@/components/ui'
import {
  POSITION_OPTIONS,
  SECTOR_OPTIONS,
  SHIFT_OPTIONS,
  STATUS_OPTIONS,
} from '@/features/employees/constants/employeeOptions'
import { useEmployeeForm } from '@/features/employees/hooks/useEmployeeForm'
import type { EmployeeFormSchema } from '@/features/employees/schemas/employee.schema'
import type { Employee } from '@/features/employees/types/employee.types'
import { getEmailDomainForPosition } from '@/features/employees/utils/employeeEmail'

export interface EmployeeFormProps {
  employee: Employee | null
  onSubmit: (values: EmployeeFormSchema) => Promise<void>
  onCancel: () => void
  isSaving?: boolean
}

export function EmployeeForm({
  employee,
  onSubmit,
  onCancel,
  isSaving = false,
}: EmployeeFormProps) {
  const { form, handleSubmit, isSubmitting } = useEmployeeForm({
    employee,
    onSubmit,
  })

  const {
    register,
    watch,
    formState: { errors },
  } = form

  const position = watch('position')
  const emailDomainHint = getEmailDomainForPosition(position)

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <Input
        label="Foto (URL)"
        placeholder="https://..."
        error={errors.photoUrl?.message}
        {...register('photoUrl')}
      />

      <Input
        label="Nome"
        placeholder="Nome completo"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="E-mail"
        type="email"
        hint={`Domínio esperado para este cargo: @${emailDomainHint}`}
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Telefone"
        placeholder="(81) 99999-9999"
        error={errors.phone?.message}
        {...register('phone')}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Cargo"
          options={POSITION_OPTIONS}
          error={errors.position?.message}
          {...register('position')}
        />
        <Select
          label="Setor"
          options={SECTOR_OPTIONS}
          error={errors.sector?.message}
          {...register('sector')}
        />
        <Select
          label="Turno"
          options={SHIFT_OPTIONS}
          error={errors.shift?.message}
          {...register('shift')}
        />
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          error={errors.status?.message}
          {...register('status')}
        />
      </div>

      <Input
        label="Data de admissão"
        type="date"
        error={errors.admissionDate?.message}
        {...register('admissionDate')}
      />

      <TextArea
        label="Observações"
        rows={3}
        error={errors.notes?.message}
        {...register('notes')}
      />

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onCancel}
          disabled={isSubmitting || isSaving}
        >
          Cancelar
        </Button>
        <Button type="submit" className="w-full sm:w-auto" isLoading={isSubmitting || isSaving}>
          {employee ? 'Salvar alterações' : 'Cadastrar colaborador'}
        </Button>
      </div>
    </form>
  )
}
