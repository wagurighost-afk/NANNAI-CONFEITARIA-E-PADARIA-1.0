import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Breadcrumb, EmptyState, PageHeader, PageShell } from '@/components/common'
import { Button, ConfirmDialog, Modal, Skeleton } from '@/components/ui'
import { LabelPrintDialogContent } from '@/features/labels/components/LabelPrintDialog'
import { buildLabelDraftFromProduction } from '@/features/labels/utils/buildLabelFromProduction'
import type { CreateLabelInput } from '@/features/labels/types/label.types'
import { recipesService } from '@/features/recipes/services/recipes.service'
import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'
import { DuplicateProductionDialog } from '@/features/production/components/DuplicateProductionDialog'
import { ProductionCard } from '@/features/production/components/ProductionCard'
import { ProductionDrawer } from '@/features/production/components/ProductionDrawer'
import { ProductionFiltersBar } from '@/features/production/components/ProductionFiltersBar'
import { ProductionForm } from '@/features/production/components/ProductionForm'
import { ProductionKpisSection } from '@/features/production/components/ProductionKpis'
import { ProductionTable } from '@/features/production/components/ProductionTable'
import { useProduction } from '@/features/production/hooks/useProduction'
import type { ProductionFormSchema } from '@/features/production/schemas/production.schema'
import { toCreateProductionInput } from '@/features/production/utils/toCreateProductionInput'
import {
  canCommentOnProduction,
  canEditProductionDay,
} from '@/features/production/utils/productionPermissions'
import { APP_ROUTES } from '@/core/constants'
import { getErrorMessage } from '@/core/errors'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks'
import { usePermission } from '@/hooks/usePermission'

export function ProductionPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermission()
  const canPrintLabels = hasPermission('labels:print')
  const { push } = useToast()
  const [labelDraft, setLabelDraft] = useState<Omit<CreateLabelInput, 'copies'> | null>(null)
  const {
    productions,
    kpis,
    isLoading,
    isKpisLoading,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    selectedProduction,
    selectProduction,
    isFormOpen,
    editingProduction,
    openCreateForm,
    openEditForm,
    closeForm,
    productionPendingDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    duplicateSource,
    openDuplicate,
    closeDuplicate,
    createProduction,
    updateProduction,
    duplicateProduction,
    updateItemStatus,
    reorderItems,
    addComment,
    isSaving,
    isDeleting,
    canManage,
    canUpdateItems,
  } = useProduction()

  const employees = EMPLOYEES_MOCK.filter((e) => e.status === 'Ativo').map((e) => ({
    id: e.id,
    name: e.name,
  }))

  const openLabelDialog = async (itemId: string) => {
    if (!selectedProduction) {
      return
    }
    const item = selectedProduction.items.find((entry) => entry.id === itemId)
    if (!item) {
      return
    }

    let recipe = null
    if (item.recipeId) {
      try {
        recipe = await recipesService.getById(item.recipeId)
      } catch {
        recipe = null
      }
    }

    setLabelDraft(
      buildLabelDraftFromProduction({
        production: selectedProduction,
        item,
        recipe,
        responsibleName: user?.name ?? selectedProduction.employeeName,
      }),
    )
  }

  const handleFormSubmit = async (values: ProductionFormSchema) => {
    const input = toCreateProductionInput(values)
    try {
      if (editingProduction) {
        await updateProduction({ id: editingProduction.id, input })
        push({ title: 'Produção atualizada', description: values.date, variant: 'success' })
      } else {
        await createProduction(input)
        push({ title: 'Produção criada', description: values.date, variant: 'success' })
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
    try {
      await confirmDelete()
      push({ title: 'Produção removida', variant: 'success' })
    } catch (error: unknown) {
      push({
        title: 'Não foi possível remover',
        description: getErrorMessage(error),
        variant: 'danger',
      })
    }
  }

  const selectedCanEdit =
    selectedProduction && user
      ? canEditProductionDay(user, selectedProduction)
      : false

  const selectedCanComment =
    selectedProduction && user
      ? canCommentOnProduction(user, selectedProduction)
      : false

  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'Produção' },
        ]}
      />

      <PageHeader
        title="Produção"
        description="Gestão operacional diária por colaborador, turno e setor."
        actions={
          canManage ? (
            <Button onClick={openCreateForm} className="w-full sm:w-auto">
              <Plus className="size-4" />
              Nova produção
            </Button>
          ) : undefined
        }
      />

      <ProductionKpisSection kpis={kpis} isLoading={isKpisLoading} />

      <div className="mb-6">
        <ProductionFiltersBar
          filters={filters}
          viewMode={viewMode}
          employees={employees}
          showEmployeeFilter={canManage}
          onFiltersChange={setFilters}
          onViewModeChange={setViewMode}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={180} />
          ))}
        </div>
      ) : productions.length === 0 ? (
        <EmptyState
          title="Nenhuma produção encontrada"
          description="Ajuste os filtros ou crie uma nova produção."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:hidden">
            {productions.map((production) => (
              <ProductionCard
                key={production.id}
                production={production}
                onClick={() => {
                  selectProduction(production.id)
                }}
              />
            ))}
          </div>

          <div className="hidden lg:block">
            {viewMode === 'table' ? (
              <ProductionTable
                productions={productions}
                onRowClick={(production) => {
                  selectProduction(production.id)
                }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {productions.map((production) => (
                  <ProductionCard
                    key={production.id}
                    production={production}
                    onClick={() => {
                      selectProduction(production.id)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <ProductionDrawer
        production={selectedProduction}
        open={Boolean(selectedProduction)}
        onClose={() => {
          selectProduction(null)
        }}
        canManage={canManage}
        canUpdateItems={canUpdateItems && selectedCanEdit}
        canComment={canUpdateItems && selectedCanComment}
        onEdit={() => {
          if (selectedProduction) {
            openEditForm(selectedProduction)
          }
        }}
        onDelete={() => {
          if (selectedProduction) {
            requestDelete(selectedProduction)
          }
        }}
        onDuplicate={() => {
          if (selectedProduction) {
            openDuplicate(selectedProduction)
          }
        }}
        onItemStatusChange={async (itemId, status) => {
          if (!selectedProduction) {
            return
          }
          try {
            await updateItemStatus({
              productionId: selectedProduction.id,
              itemId,
              status,
            })
            if (status === 'Concluído' && canPrintLabels) {
              void openLabelDialog(itemId)
            }
          } catch (error: unknown) {
            push({
              title: 'Erro ao atualizar item',
              description: getErrorMessage(error),
              variant: 'danger',
            })
          }
        }}
        onCreateLabel={openLabelDialog}
        canPrintLabels={canPrintLabels}
        onReorder={async (itemIds) => {
          if (!selectedProduction) {
            return
          }
          try {
            await reorderItems({
              productionId: selectedProduction.id,
              itemIds,
            })
          } catch (error: unknown) {
            push({
              title: 'Erro ao reordenar',
              description: getErrorMessage(error),
              variant: 'danger',
            })
          }
        }}
        onAddComment={async (input) => {
          if (!selectedProduction) {
            return
          }
          try {
            await addComment({
              productionId: selectedProduction.id,
              message: input.message,
              photos: input.photos,
            })
            push({ title: 'Comentário enviado', variant: 'success' })
          } catch (error: unknown) {
            push({
              title: 'Não foi possível enviar o comentário',
              description: getErrorMessage(error),
              variant: 'danger',
            })
            throw error
          }
        }}
      />

      <Modal
        open={Boolean(labelDraft)}
        onClose={() => setLabelDraft(null)}
        title="Gerar etiqueta"
        description="A produção foi concluída. Revise os dados e imprima a etiqueta."
        size="lg"
      >
        {labelDraft ? (
          <LabelPrintDialogContent
            initialDraft={labelDraft}
            onCancel={() => setLabelDraft(null)}
            onCompleted={() => {
              setLabelDraft(null)
              push({ title: 'Etiqueta registrada', variant: 'success' })
            }}
          />
        ) : null}
      </Modal>

      <Modal
        open={isFormOpen}
        onClose={closeForm}
        title={editingProduction ? 'Editar produção' : 'Nova produção'}
        size="lg"
      >
        <ProductionForm
          production={editingProduction}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSaving={isSaving}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(productionPendingDelete)}
        onClose={cancelDelete}
        onConfirm={handleConfirmDelete}
        title="Remover produção"
        description={`Deseja remover a produção de ${productionPendingDelete?.employeeName}?`}
        confirmLabel="Remover"
        isConfirming={isDeleting}
        variant="danger"
      />

      <DuplicateProductionDialog
        production={duplicateSource}
        open={Boolean(duplicateSource)}
        onClose={closeDuplicate}
        isLoading={isSaving}
        onConfirm={async (input) => {
          if (!duplicateSource) {
            return
          }
          try {
            await duplicateProduction({
              sourceId: duplicateSource.id,
              ...input,
            })
            push({ title: 'Produção duplicada', variant: 'success' })
          } catch (error: unknown) {
            push({
              title: 'Não foi possível duplicar',
              description: getErrorMessage(error),
              variant: 'danger',
            })
          }
        }}
      />
    </PageShell>
  )
}
