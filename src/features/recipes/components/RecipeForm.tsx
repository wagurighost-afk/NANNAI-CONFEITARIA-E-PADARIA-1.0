import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Button, Checkbox, Input, Select, TextArea } from '@/components/ui'
import { RecipeDocumentUpload } from '@/features/recipes/components/RecipeDocumentUpload'
import { RECIPE_CATEGORIES, RECIPE_STATUSES } from '@/features/recipes/types/recipe.types'
import { useRecipeForm } from '@/features/recipes/hooks/useRecipeForm'
import type { Recipe, RecipeFormSubmitPayload } from '@/features/recipes/types/recipe.types'
import { popService } from '@/features/pop/services/pop.service'

const CATEGORY_OPTIONS = RECIPE_CATEGORIES.map((c) => ({ value: c, label: c }))
const STATUS_OPTIONS = RECIPE_STATUSES.map((s) => ({ value: s, label: s }))

export type RecipeFormMode = 'document' | 'manual'

export function RecipeForm({
  recipe,
  mode,
  canUploadDocument = false,
  onSubmit,
  onCancel,
  isSaving = false,
}: {
  recipe: Recipe | null
  mode: RecipeFormMode
  canUploadDocument?: boolean
  onSubmit: (payload: RecipeFormSubmitPayload) => Promise<void>
  onCancel: () => void
  isSaving?: boolean
}) {
  const [attachment, setAttachment] = useState<File | null>(null)
  const [removeExistingAttachment, setRemoveExistingAttachment] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { form, handleSubmit, isSubmitting } = useRecipeForm({
    recipe,
    onSubmit: async (values) => {
      setSubmitError(null)
      await onSubmit({
        values,
        attachment,
        removeExistingAttachment,
      })
    },
  })

  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' })
  const relatedPopIds = watch('relatedPopIds')

  const popsQuery = useQuery({
    queryKey: ['pop', 'list'],
    queryFn: () => popService.list(),
    staleTime: 5 * 60_000,
  })

  const existingAttachment =
    recipe && !removeExistingAttachment ? (recipe.attachments[0] ?? null) : null

  const isDocumentMode = mode === 'document'

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {recipe ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          Código: <span className="font-medium">{recipe.recipeCode}</span>
        </p>
      ) : null}

      {isDocumentMode ? (
        <p className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-muted-foreground">
          Envie a ficha técnica em PDF, Excel ou Word. Os detalhes completos ficam no documento —
          você só precisa informar nome e categoria.
        </p>
      ) : (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Cadastre ingredientes e modo de preparo diretamente no sistema.
        </p>
      )}

      {isDocumentMode && canUploadDocument ? (
        <RecipeDocumentUpload
          existingAttachment={existingAttachment}
          disabled={isSubmitting || isSaving}
          onNameSuggestion={(name) => {
            const currentName = form.getValues('name')
            if (!currentName.trim()) {
              setValue('name', name, { shouldValidate: true })
            }
          }}
          onFileChange={(file, removeExisting) => {
            setAttachment(file)
            setRemoveExistingAttachment(removeExisting)
            setSubmitError(null)
          }}
        />
      ) : null}

      <Input label="Nome da receita" error={errors.name?.message} {...register('name')} />

      <div className={`grid gap-4 ${isDocumentMode ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
        <Select
          label="Categoria"
          options={CATEGORY_OPTIONS}
          error={errors.category?.message}
          {...register('category')}
        />
        {!isDocumentMode ? (
          <>
            <Input
              label="Tempo (min)"
              type="number"
              min="0"
              error={errors.prepTimeMinutes?.message}
              {...register('prepTimeMinutes', { valueAsNumber: true })}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              error={errors.status?.message}
              {...register('status')}
            />
          </>
        ) : (
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status')}
          />
        )}
      </div>

      {!isDocumentMode ? (
        <>
          <Input label="Rendimento" error={errors.yield?.message} {...register('yield')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Tempo de forno (min)"
              type="number"
              min="0"
              error={errors.ovenTimeMinutes?.message}
              {...register('ovenTimeMinutes', { valueAsNumber: true })}
            />
            <Input
              label="Peso final"
              placeholder="Ex.: 3,2 kg"
              error={errors.finalWeight?.message}
              {...register('finalWeight')}
            />
          </div>
          <Input
            label="Chef responsável (opcional)"
            placeholder="Ex.: Chef Ana"
            error={errors.chef?.message}
            {...register('chef')}
          />
          <Input
            label="Temperatura (opcional)"
            placeholder="Ex.: 180°C por 25 min"
            error={errors.temperature?.message}
            {...register('temperature')}
          />
          <Input
            label="URL da foto (opcional)"
            placeholder="https://..."
            error={errors.photoUrl?.message}
            {...register('photoUrl')}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Ingredientes</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', quantity: 0, unit: 'g' })}
              >
                <Plus className="size-4" />
                Adicionar
              </Button>
            </div>
            {errors.ingredients?.message ? (
              <p className="text-sm text-danger">{errors.ingredients.message}</p>
            ) : null}
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_100px_80px_auto]"
              >
                <Input
                  label="Ingrediente"
                  error={errors.ingredients?.[index]?.name?.message}
                  {...register(`ingredients.${index}.name`)}
                />
                <Input
                  label="Qtd"
                  type="number"
                  min="0"
                  error={errors.ingredients?.[index]?.quantity?.message}
                  {...register(`ingredients.${index}.quantity`, { valueAsNumber: true })}
                />
                <Input
                  label="Un."
                  error={errors.ingredients?.[index]?.unit?.message}
                  {...register(`ingredients.${index}.unit`)}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="px-2"
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <TextArea
            label="Modo de preparo"
            rows={4}
            error={errors.preparationMethod?.message}
            {...register('preparationMethod')}
          />
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Chef responsável (opcional)"
            placeholder="Ex.: Chef Ana"
            error={errors.chef?.message}
            {...register('chef')}
          />
          <Input
            label="Temperatura (opcional)"
            placeholder="Ex.: 180°C"
            error={errors.temperature?.message}
            {...register('temperature')}
          />
          <Input
            label="URL da foto (opcional)"
            placeholder="https://..."
            error={errors.photoUrl?.message}
            {...register('photoUrl')}
          />
        </div>
      )}

      {(popsQuery.data?.length ?? 0) > 0 ? (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <p className="text-sm font-medium">POPs relacionados (opcional)</p>
          <div className="space-y-2">
            {popsQuery.data?.map((pop) => {
              const checked = relatedPopIds.includes(pop.id)
              return (
                <label key={pop.id} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-muted/40">
                  <Checkbox
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? relatedPopIds.filter((id) => id !== pop.id)
                        : [...relatedPopIds, pop.id]
                      setValue('relatedPopIds', next, { shouldDirty: true })
                    }}
                  />
                  <span className="text-sm">
                    <span className="font-medium text-foreground">{pop.title}</span>
                    <span className="mt-0.5 block text-muted-foreground">{pop.summary}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ) : null}

      <TextArea label="Observações (opcional)" rows={2} error={errors.notes?.message} {...register('notes')} />

      {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || isSaving}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting || isSaving}>
          {recipe ? 'Salvar' : isDocumentMode ? 'Cadastrar com documento' : 'Cadastrar receita'}
        </Button>
      </div>
    </form>
  )
}
