import { Button, Input, Select, TextArea } from '@/components/ui'
import {
  CATEGORY_OPTIONS,
  UNIT_OPTIONS,
} from '@/features/ingredients/constants/ingredientOptions'
import { useIngredientForm } from '@/features/ingredients/hooks/useIngredientForm'
import type { IngredientFormSchema } from '@/features/ingredients/schemas/ingredient.schema'
import type { Ingredient } from '@/features/ingredients/types/ingredient.types'

export interface IngredientFormProps {
  ingredient: Ingredient | null
  onSubmit: (values: IngredientFormSchema) => Promise<void>
  onCancel: () => void
  isSaving?: boolean
}

export function IngredientForm({
  ingredient,
  onSubmit,
  onCancel,
  isSaving = false,
}: IngredientFormProps) {
  const { form, handleSubmit, isSubmitting } = useIngredientForm({
    ingredient,
    onSubmit,
  })

  const {
    register,
    formState: { errors },
  } = form

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {ingredient ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Código interno:{' '}
          <span className="font-medium text-foreground">{ingredient.ingredientCode}</span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          O código interno (ING-000XXX) será gerado automaticamente no cadastro.
        </p>
      )}

      <Input
        label="Nome"
        placeholder="Nome do ingrediente"
        error={errors.name?.message}
        {...register('name')}
      />

      <TextArea
        label="Descrição"
        rows={2}
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Categoria"
          options={CATEGORY_OPTIONS}
          error={errors.category?.message}
          {...register('category')}
        />
        <Select
          label="Unidade"
          options={UNIT_OPTIONS}
          error={errors.unit?.message}
          {...register('unit')}
        />
      </div>

      <Input
        label="Fornecedor"
        error={errors.supplier?.message}
        {...register('supplier')}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Custo médio"
          type="number"
          step="0.01"
          min="0"
          error={errors.averageCost?.message}
          {...register('averageCost', { valueAsNumber: true })}
        />
        <Input
          label="Estoque atual"
          type="number"
          step="0.01"
          min="0"
          error={errors.currentStock?.message}
          {...register('currentStock', { valueAsNumber: true })}
        />
        <Input
          label="Estoque mínimo"
          type="number"
          step="0.01"
          min="0"
          error={errors.minimumStock?.message}
          {...register('minimumStock', { valueAsNumber: true })}
        />
        <Input
          label="Estoque máximo"
          type="number"
          step="0.01"
          min="0"
          error={errors.maximumStock?.message}
          {...register('maximumStock', { valueAsNumber: true })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Validade"
          type="date"
          error={errors.expirationDate?.message}
          {...register('expirationDate')}
        />
        <Input label="Lote" error={errors.lot?.message} {...register('lot')} />
        <Input
          label="Localização"
          error={errors.location?.message}
          {...register('location')}
        />
      </div>

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
          {ingredient ? 'Salvar alterações' : 'Cadastrar ingrediente'}
        </Button>
      </div>
    </form>
  )
}
