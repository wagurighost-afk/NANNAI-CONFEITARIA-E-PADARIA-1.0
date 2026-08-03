import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray } from 'react-hook-form'
import { Button, Input, Select, TextArea } from '@/components/ui'
import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'
import { EMPLOYEE_SHIFTS, PRODUCTION_SECTORS } from '@/features/employees/types/employee.types'
import { PRODUCTION_STATUS_OPTIONS } from '@/features/production/constants/productionOptions'
import { useProductionForm } from '@/features/production/hooks/useProductionForm'
import type { ProductionFormSchema } from '@/features/production/schemas/production.schema'
import type { ProductionDay } from '@/features/production/types/production.types'

const EMPLOYEE_OPTIONS = EMPLOYEES_MOCK.filter((e) => e.status === 'Ativo').map((e) => ({
  value: e.id,
  label: e.name,
}))

const SHIFT_OPTIONS = EMPLOYEE_SHIFTS.map((s) => ({ value: s, label: s }))
const SECTOR_OPTIONS = PRODUCTION_SECTORS.map((s) => ({ value: s, label: s }))

export interface ProductionFormProps {
  production: ProductionDay | null
  onSubmit: (values: ProductionFormSchema) => Promise<void>
  onCancel: () => void
  isSaving?: boolean
  canManageAssignment?: boolean
}

export function ProductionForm({
  production,
  onSubmit,
  onCancel,
  isSaving = false,
  canManageAssignment = true,
}: ProductionFormProps) {
  const { form, handleSubmit, isSubmitting } = useProductionForm({
    production,
    onSubmit,
  })

  const {
    register,
    control,
    formState: { errors },
  } = form

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {production ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Código: <span className="font-medium text-foreground">{production.productionCode}</span>
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Data"
          type="date"
          error={errors.date?.message}
          disabled={!canManageAssignment}
          {...register('date')}
        />
        <Select
          label="Turno"
          options={SHIFT_OPTIONS}
          error={errors.shift?.message}
          disabled={!canManageAssignment}
          {...register('shift')}
        />
        <Select
          label="Setor"
          options={SECTOR_OPTIONS}
          error={errors.sector?.message}
          disabled={!canManageAssignment}
          {...register('sector')}
        />
        <Select
          label="Responsável"
          options={[{ value: '', label: 'Selecione...' }, ...EMPLOYEE_OPTIONS]}
          error={errors.employeeId?.message}
          disabled={!canManageAssignment}
          {...register('employeeId')}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Itens de produção</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              append({ name: '', status: 'Pendente' })
            }}
          >
            <Plus className="size-4" />
            Adicionar item
          </Button>
        </div>

        {errors.items?.message ? (
          <p className="text-sm text-danger">{errors.items.message}</p>
        ) : null}

        {fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_auto_auto]">
            <Input
              label={`Item ${index + 1}`}
              placeholder="Nome do produto"
              error={errors.items?.[index]?.name?.message}
              {...register(`items.${index}.name`)}
            />
            <Select
              label="Status"
              options={PRODUCTION_STATUS_OPTIONS}
              error={errors.items?.[index]?.status?.message}
              {...register(`items.${index}.status`)}
            />
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="px-2"
                aria-label="Remover item"
                disabled={fields.length <= 1}
                onClick={() => {
                  remove(index)
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <TextArea label="Observações" rows={3} error={errors.notes?.message} {...register('notes')} />

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
          {production ? 'Salvar alterações' : 'Criar produção'}
        </Button>
      </div>
    </form>
  )
}
