import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Breadcrumb, EmptyState, PageHeader, PageShell } from '@/components/common'
import { Button, ConfirmDialog, Modal, Skeleton } from '@/components/ui'
import { LabelPrintDialogContent } from '@/features/labels/components/LabelPrintDialog'
import {
  printProductionItemLabel,
  ProductionLabelPrintError,
} from '@/features/labels/services/printProductionLabel'
import type { CreateLabelInput, LabelRecord } from '@/features/labels/types/label.types'
import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'
import { DuplicateProductionDialog } from '@/features/production/components/DuplicateProductionDialog'
import { ProductionCard } from '@/features/production/components/ProductionCard'
import { ProductionDrawer } from '@/features/production/components/ProductionDrawer'
import { ProductionFiltersBar } from '@/features/production/components/ProductionFiltersBar'
import { ProductionForm } from '@/features/production/components/ProductionForm'
import { ProductionKpisSection } from '@/features/production/components/ProductionKpis'
import { ProductionConferenceKpisSection } from '@/features/production/components/ProductionConferenceKpis'
import { ProductionTable } from '@/features/production/components/ProductionTable'
import { useProduction } from '@/features/production/hooks/useProduction'
import type { ProductionFormSchema } from '@/features/production/schemas/production.schema'
import { toCreateProductionInput } from '@/features/production/utils/toCreateProductionInput'
import {
  canCommentOnProduction,
  canOpenProductionForm,
} from '@/features/production/utils/productionPermissions'
import { APP_ROUTES } from '@/core/constants'
import { getErrorMessage } from '@/core/errors'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks'
import { usePermission } from '@/hooks/usePermission'

type PendingLabelPrompt = {
  itemId: string
  itemName: string
  mode: 'create' | 'reprint-or-create'
}

export function ProductionPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermission()
  const canPrintLabels = hasPermission('labels:print')
  const { push } = useToast()
  const queryClient = useQueryClient()
  const [pendingLabelPrompt, setPendingLabelPrompt] = useState<PendingLabelPrompt | null>(null)
  const [isPrintingLabel, setIsPrintingLabel] = useState(false)
  const [manualLabelDraft, setManualLabelDraft] = useState<Omit<CreateLabelInput, 'copies'> | null>(
    null,
  )
  const [manualLabelRecord, setManualLabelRecord] = useState<LabelRecord | null>(null)
  const {
    productions,
    kpis,
    conferenceKpis,
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
    updateItemConference,
    reorderItems,
    addComment,
    isSaving,
    isDeleting,
    canManage,
    canUpdateItems,
    canEditSelectedProduction,
  } = useProduction()

  const employees = EMPLOYEES_MOCK.filter((e) => e.status === 'Ativo').map((e) => ({
    id: e.id,
    name: e.name,
  }))

  const askPrintLabel = (itemId: string, mode: PendingLabelPrompt['mode'] = 'create') => {
    if (!selectedProduction) {
      return
    }
    const item = selectedProduction.items.find((entry) => entry.id === itemId)
    if (!item) {
      return
    }
    setPendingLabelPrompt({
      itemId,
      itemName: item.name,
      mode,
    })
  }

  const handleConfirmPrintLabel = async () => {
    if (!selectedProduction || !pendingLabelPrompt) {
      return
    }

    const prompt = pendingLabelPrompt
    setPendingLabelPrompt(null)
    setIsPrintingLabel(true)

    try {
      const result = await printProductionItemLabel({
        productionId: selectedProduction.id,
        itemId: prompt.itemId,
        copies: 1,
        mode: prompt.mode,
        adapterId: 'niimbot-bluetooth',
      })
      void queryClient.invalidateQueries({ queryKey: ['labels'] })
      push({
        title: result.mode === 'reprint' ? 'Etiqueta reimpressa' : 'Etiqueta impressa',
        description: `${result.record.data.productName} · lote ${result.record.data.batchNumber}`,
        variant: 'success',
      })
    } catch (error: unknown) {
      void queryClient.invalidateQueries({ queryKey: ['labels'] })

      const savedRecord =
        error instanceof ProductionLabelPrintError ? error.record : undefined

      push({
        title: savedRecord ? 'Etiqueta salva, falha na impressão' : 'Falha ao imprimir etiqueta',
        description: getErrorMessage(error),
        variant: 'danger',
      })

      if (savedRecord) {
        setManualLabelRecord(savedRecord)
        setManualLabelDraft({
          templateId: savedRecord.templateId,
          data: savedRecord.data,
          ...(savedRecord.productionId ? { productionId: savedRecord.productionId } : {}),
          ...(savedRecord.productionItemId
            ? { productionItemId: savedRecord.productionItemId }
            : {}),
          ...(savedRecord.recipeId ? { recipeId: savedRecord.recipeId } : {}),
        })
      }
    } finally {
      setIsPrintingLabel(false)
    }
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

  const selectedCanEdit = selectedProduction
    ? canEditSelectedProduction(selectedProduction)
    : false

  const selectedCanOpenForm =
    selectedProduction && user
      ? canOpenProductionForm(user, selectedProduction, hasPermission)
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

      <ProductionConferenceKpisSection kpis={conferenceKpis} isLoading={isLoading} />

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
        canEditForm={selectedCanOpenForm}
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
            push({
              title: 'Status atualizado',
              description: `Item marcado como ${status}.`,
              variant: 'success',
            })
            if (status === 'Concluído' && canPrintLabels) {
              askPrintLabel(itemId, 'create')
            }
          } catch (error: unknown) {
            push({
              title: 'Erro ao atualizar item',
              description: getErrorMessage(error),
              variant: 'danger',
            })
          }
        }}
        onCreateLabel={(itemId) => askPrintLabel(itemId, 'reprint-or-create')}
        canPrintLabels={canPrintLabels}
        conferenceFilter={filters.conferenceFilter ?? 'all'}
        canUpdateConference={canUpdateItems && selectedCanEdit}
        onConferenceChange={async (itemId, status) => {
          if (!selectedProduction) {
            return
          }
          try {
            await updateItemConference({
              productionId: selectedProduction.id,
              itemId,
              status,
            })
            push({
              title: 'Conferência atualizada',
              description: 'Status do item registrado com sucesso.',
              variant: 'success',
            })
          } catch (error: unknown) {
            push({
              title: 'Erro ao atualizar conferência',
              description: getErrorMessage(error),
              variant: 'danger',
            })
            throw error
          }
        }}
        onReorder={async (itemIds) => {
          if (!selectedProduction) {
            return
          }
          try {
            await reorderItems({
              productionId: selectedProduction.id,
              itemIds,
            })
            push({ title: 'Itens reordenados', variant: 'success' })
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

      <ConfirmDialog
        open={Boolean(pendingLabelPrompt)}
        onClose={() => setPendingLabelPrompt(null)}
        onConfirm={() => void handleConfirmPrintLabel()}
        title="Deseja imprimir etiqueta?"
        description={
          pendingLabelPrompt
            ? `Gerar automaticamente a etiqueta de “${pendingLabelPrompt.itemName}” (produto, responsável, validade, lote, peso, categoria e QR) e enviar para a NIIMBOT.`
            : undefined
        }
        confirmLabel="SIM"
        cancelLabel="NÃO"
        isConfirming={isPrintingLabel}
      />

      <Modal
        open={isPrintingLabel}
        onClose={() => undefined}
        title="Imprimindo etiqueta"
        description="Gerando dados e enviando para a NIIMBOT…"
        size="sm"
      >
        <p className="text-sm text-muted-foreground">
          Aguarde a conclusão da impressão. Não feche esta janela.
        </p>
      </Modal>

      <Modal
        open={Boolean(manualLabelDraft)}
        onClose={() => {
          setManualLabelDraft(null)
          setManualLabelRecord(null)
        }}
        title="Reimprimir etiqueta"
        description="A etiqueta foi salva no histórico. Você pode tentar imprimir novamente."
        size="lg"
      >
        {manualLabelDraft ? (
          <LabelPrintDialogContent
            initialDraft={manualLabelDraft}
            mode={manualLabelRecord ? 'reprint' : 'create'}
            {...(manualLabelRecord ? { existingRecord: manualLabelRecord } : {})}
            onCancel={() => {
              setManualLabelDraft(null)
              setManualLabelRecord(null)
            }}
            onCompleted={() => {
              setManualLabelDraft(null)
              setManualLabelRecord(null)
              push({ title: 'Etiqueta reimpressa', variant: 'success' })
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
          canManageAssignment={canManage}
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
