import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Breadcrumb, EmptyState, PageShell } from '@/components/common'
import { Button, ConfirmDialog, Modal, Skeleton } from '@/components/ui'
import { RecipeDetailToolbar } from '@/features/recipes/components/RecipeDetailToolbar'
import { RecipeForm } from '@/features/recipes/components/RecipeForm'
import { RecipeHistorySection } from '@/features/recipes/components/RecipeHistorySection'
import { RecipeProductionView } from '@/features/recipes/components/RecipeProductionView'
import { RecipeSpreadsheetView } from '@/features/recipes/components/RecipeSpreadsheetView'
import { RecipeViewModeToggle } from '@/features/recipes/components/RecipeViewModeToggle'
import { useRecipeDetail } from '@/features/recipes/hooks/useRecipeDetail'
import { useRecipeHistory } from '@/features/recipes/hooks/useRecipeHistory'
import { useRecipeViewMode } from '@/features/recipes/hooks/useRecipeViewMode'
import { isRecipeDocumentPrimary } from '@/features/recipes/utils/isRecipeDocumentPrimary'
import { resolveRecipeFormValues } from '@/features/recipes/utils/resolveRecipeFormValues'
import type { RecipeFormSubmitPayload } from '@/features/recipes/types/recipe.types'
import { recipesService } from '@/features/recipes/services/recipes.service'
import { APP_ROUTES } from '@/core/constants'
import { getErrorMessage } from '@/core/errors'
import { canManageOperationalData } from '@/core/permissions/systemAccess'
import { useAuth } from '@/hooks/useAuth'
import { usePermission } from '@/hooks/usePermission'
import { useToast } from '@/hooks'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export function RecipeDetailPage() {
  const { recipeId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { hasPermission } = usePermission()
  const canManage = hasPermission('recipes:manage') || canManageOperationalData(user)
  const canViewAudit = hasPermission('audit:view')
  const isCompact = useMediaQuery('(max-width: 1023px)')
  const { push } = useToast()

  const {
    recipe,
    isLoading,
    isError,
    toggleFavorite,
    archiveRecipe,
    duplicateRecipe,
    deleteRecipe,
    isTogglingFavorite,
    isArchiving,
    isDuplicating,
    isDeleting,
  } = useRecipeDetail(recipeId)

  const { entries, isLoading: isHistoryLoading, isAuditSource } = useRecipeHistory(recipe, canViewAudit)
  const hasSpreadsheet = Boolean(recipe?.attachments.length)
  const { mode, setMode, canToggle } = useRecipeViewMode(hasSpreadsheet)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (payload: RecipeFormSubmitPayload) => {
    if (!recipe) {
      return
    }

    const resolved = resolveRecipeFormValues(payload.values, payload.attachment)
    if (!resolved.success) {
      push({ title: 'Dados inválidos', description: resolved.error, variant: 'danger' })
      return
    }

    try {
      setIsSaving(true)
      await recipesService.saveFromForm(
        {
          values: resolved.data,
          attachment: payload.attachment,
          removeExistingAttachment: payload.removeExistingAttachment ?? false,
        },
        recipe.id,
      )
      push({ title: 'Receita atualizada', variant: 'success' })
      setIsFormOpen(false)
    } catch (error: unknown) {
      push({ title: 'Erro', description: getErrorMessage(error), variant: 'danger' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="rectangular" height={48} />
        <Skeleton variant="rectangular" height={320} />
        <Skeleton variant="rectangular" height={240} />
      </div>
    )
  }

  if (isError || !recipe) {
    return (
      <EmptyState
        title="Receita não encontrada"
        description="Verifique o link ou volte para a listagem."
        action={
          <Button onClick={() => navigate(APP_ROUTES.recipes)}>Voltar para receitas</Button>
        }
      />
    )
  }

  const formMode = isRecipeDocumentPrimary(recipe) ? 'document' : 'manual'

  return (
    <PageShell className="mx-auto w-full max-w-5xl space-y-5 overflow-x-hidden pb-10">
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'Receitas', href: APP_ROUTES.recipes },
          { label: recipe.name },
        ]}
      />

      <RecipeDetailToolbar
        recipe={recipe}
        canManage={canManage}
        isTogglingFavorite={isTogglingFavorite}
        isArchiving={isArchiving}
        isDuplicating={isDuplicating}
        onToggleFavorite={async () => {
          await toggleFavorite()
          push({
            title: recipe.isFavorite ? 'Removida dos favoritos' : 'Adicionada aos favoritos',
            variant: 'success',
          })
        }}
        onDuplicate={async () => {
          await duplicateRecipe()
          push({ title: 'Receita duplicada', variant: 'success' })
        }}
        onArchive={async () => {
          await archiveRecipe()
          push({ title: 'Receita arquivada', variant: 'success' })
        }}
        onEdit={() => setIsFormOpen(true)}
        onDelete={() => setIsDeleteOpen(true)}
      />

      {canToggle ? (
        <div className="no-print">
          <RecipeViewModeToggle mode={mode} onChange={setMode} />
        </div>
      ) : null}

      <div id="recipe-print-content" className="space-y-4">
        {mode === 'production' ? (
          <>
            <RecipeProductionView recipe={recipe} kitchenMode={isCompact} />
            <RecipeHistorySection
              entries={entries}
              isLoading={isHistoryLoading}
              isAuditSource={isAuditSource}
              kitchenMode={isCompact}
            />
          </>
        ) : (
          <RecipeSpreadsheetView recipe={recipe} />
        )}
      </div>

      <Modal open={isFormOpen} onClose={() => setIsFormOpen(false)} title="Editar receita" size="lg">
        <RecipeForm
          recipe={recipe}
          mode={formMode}
          canUploadDocument={canManage}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
          isSaving={isSaving}
        />
      </Modal>

      <ConfirmDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await deleteRecipe()
            push({ title: 'Receita removida', variant: 'success' })
          } catch (error: unknown) {
            push({ title: 'Erro', description: getErrorMessage(error), variant: 'danger' })
          }
        }}
        title="Remover receita"
        description={`Remover ${recipe.name} permanentemente?`}
        confirmLabel="Remover"
        isConfirming={isDeleting}
        variant="danger"
      />
    </PageShell>
  )
}
