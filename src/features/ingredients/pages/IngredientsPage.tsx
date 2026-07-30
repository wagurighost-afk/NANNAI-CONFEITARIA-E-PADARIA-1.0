import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { Breadcrumb, EmptyState, PageHeader } from '@/components/common'
import { Button, ConfirmDialog, Modal } from '@/components/ui'
import { IngredientCard } from '@/features/ingredients/components/IngredientCard'
import { IngredientDrawer } from '@/features/ingredients/components/IngredientDrawer'
import { IngredientFiltersBar } from '@/features/ingredients/components/IngredientFiltersBar'
import { IngredientForm } from '@/features/ingredients/components/IngredientForm'
import { IngredientKpisSection } from '@/features/ingredients/components/IngredientKpis'
import { IngredientTable } from '@/features/ingredients/components/IngredientTable'
import { useIngredients } from '@/features/ingredients/hooks/useIngredients'
import type { IngredientFormSchema } from '@/features/ingredients/schemas/ingredient.schema'
import type { Ingredient } from '@/features/ingredients/types/ingredient.types'
import { useToast } from '@/hooks'
import { getErrorMessage } from '@/core/errors'
import { APP_ROUTES } from '@/core/constants'

export function IngredientsPage() {
  const {
    ingredients,
    kpis,
    suppliers,
    isLoading,
    isKpisLoading,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    selectedIngredient,
    selectIngredient,
    isFormOpen,
    editingIngredient,
    openCreateForm,
    openEditForm,
    closeForm,
    createIngredient,
    updateIngredient,
    isSaving,
    ingredientPendingDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    isDeleting,
  } = useIngredients()

  const { push } = useToast()

  const handleFormSubmit = async (values: IngredientFormSchema) => {
    try {
      if (editingIngredient) {
        await updateIngredient({ id: editingIngredient.id, input: values })
        push({
          title: 'Ingrediente atualizado',
          description: values.name,
          variant: 'success',
        })
      } else {
        await createIngredient(values)
        push({
          title: 'Ingrediente cadastrado',
          description: values.name,
          variant: 'success',
        })
      }
      closeForm()
    } catch (error: unknown) {
      push({
        title: 'Não foi possível salvar',
        description: getErrorMessage(error),
        variant: 'danger',
      })
    }
  }

  const handleConfirmDelete = async () => {
    const name = ingredientPendingDelete?.name
    try {
      await confirmDelete()
      push({
        title: 'Ingrediente removido',
        description: name,
        variant: 'success',
      })
    } catch (error: unknown) {
      push({
        title: 'Não foi possível excluir',
        description: getErrorMessage(error),
        variant: 'danger',
      })
    }
  }

  const openIngredient = (ingredient: Ingredient) => {
    selectIngredient(ingredient.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="pb-4"
    >
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'Ingredientes' },
        ]}
      />

      <PageHeader
        title="Ingredientes"
        description="Catálogo base para receitas, produção, estoque e compras."
        actions={
          <Button onClick={openCreateForm} className="w-full sm:w-auto">
            <Plus className="size-4" />
            Novo ingrediente
          </Button>
        }
      />

      <IngredientKpisSection kpis={kpis} isLoading={isKpisLoading} />

      <div className="mb-5">
        <IngredientFiltersBar
          filters={filters}
          suppliers={suppliers}
          viewMode={viewMode}
          onFiltersChange={setFilters}
          onViewModeChange={setViewMode}
        />
      </div>

      {!isLoading && ingredients.length === 0 ? (
        <EmptyState
          title="Nenhum ingrediente encontrado"
          description="Ajuste os filtros ou cadastre um novo item do catálogo."
          action={
            <Button onClick={openCreateForm} className="w-full sm:w-auto">
              <Plus className="size-4" />
              Cadastrar
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {ingredients.map((ingredient) => (
              <IngredientCard
                key={ingredient.id}
                ingredient={ingredient}
                onSelect={openIngredient}
              />
            ))}
          </div>

          <div className="hidden lg:block">
            {viewMode === 'table' ? (
              <IngredientTable
                ingredients={ingredients}
                isLoading={isLoading}
                onSelect={openIngredient}
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {ingredients.map((ingredient) => (
                  <IngredientCard
                    key={ingredient.id}
                    ingredient={ingredient}
                    onSelect={openIngredient}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <IngredientDrawer
        open={selectedIngredient !== null}
        ingredient={selectedIngredient}
        onClose={() => {
          selectIngredient(null)
        }}
        onEdit={(ingredient) => {
          selectIngredient(null)
          openEditForm(ingredient)
        }}
        onDelete={(ingredient) => {
          requestDelete(ingredient)
        }}
      />

      <Modal
        open={isFormOpen}
        onClose={closeForm}
        title={editingIngredient ? 'Editar ingrediente' : 'Novo ingrediente'}
        description="Preencha os dados do item. O status é calculado automaticamente pelo estoque e validade."
        size="lg"
      >
        <IngredientForm
          ingredient={editingIngredient}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSaving={isSaving}
        />
      </Modal>

      <ConfirmDialog
        open={ingredientPendingDelete !== null}
        onClose={cancelDelete}
        onConfirm={() => {
          void handleConfirmDelete()
        }}
        title="Excluir ingrediente"
        description={
          ingredientPendingDelete
            ? `Remover ${ingredientPendingDelete.name} (${ingredientPendingDelete.ingredientCode})?`
            : undefined
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isConfirming={isDeleting}
      />
    </motion.div>
  )
}
