import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FileText, Plus, ScrollText, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Breadcrumb, PageHeader } from '@/components/common'
import {
  Button,
  ConfirmDialog,
  Modal,
} from '@/components/ui'
import { RecipeFiltersBar } from '@/features/recipes/components/RecipeFiltersBar'
import { RecipeForm } from '@/features/recipes/components/RecipeForm'
import { RecipeList } from '@/features/recipes/components/RecipeList'
import { SendRecipesToProductionDialog } from '@/features/recipes/components/SendRecipesToProductionDialog'
import { RecipeKpisSection } from '@/features/recipes/components/RecipeKpis'
import { useRecipeBatchSelection } from '@/features/recipes/hooks/useRecipeBatchSelection'
import { useRecipes } from '@/features/recipes/hooks/useRecipes'
import { sendRecipesToProduction } from '@/features/recipes/services/sendRecipesToProduction'
import { recipesService } from '@/features/recipes/services/recipes.service'
import type { RecipeFormSubmitPayload } from '@/features/recipes/types/recipe.types'
import { resolveRecipeFormValues } from '@/features/recipes/utils/resolveRecipeFormValues'
import { APP_ROUTES } from '@/core/constants'
import { getErrorMessage } from '@/core/errors'
import { canManageOperationalData } from '@/core/permissions/systemAccess'
import { usePermission } from '@/hooks/usePermission'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks'

export function RecipesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { hasPermission } = usePermission()
  const canManage = hasPermission('recipes:manage') || canManageOperationalData(user)
  const canSendToProduction = canManageOperationalData(user)
  const { push } = useToast()
  const queryClient = useQueryClient()
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [isSendingToProduction, setIsSendingToProduction] = useState(false)
  const {
    recipes,
    total,
    totalPages,
    page,
    setPage,
    kpis,
    isLoading,
    isKpisLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isCompactList,
    isSearching,
    searchHistory,
    removeSearchHistory,
    clearSearchHistory,
    filters,
    setFilters,
    setSearch,
    setQuickFilter,
    setSortBy,
    toggleSortOrder,
    isFormOpen,
    isCreateChoiceOpen,
    formMode,
    editingRecipe,
    openCreateChoice,
    closeCreateChoice,
    openCreateForm,
    closeForm,
    recipePendingDelete,
    cancelDelete,
    confirmDelete,
    saveRecipe,
    isSaving,
    isDeleting,
  } = useRecipes()

  const {
    selectionMode,
    setSelectionMode,
    selectedRecipes,
    selectedCount,
    toggleRecipe,
    clearSelection,
    selectAllVisible,
    isSelected,
  } = useRecipeBatchSelection(recipes)

  const handleSubmit = async (payload: RecipeFormSubmitPayload) => {
    const hasExistingAttachment =
      Boolean(editingRecipe?.attachments.length) && !payload.removeExistingAttachment
    const requiresAttachment = formMode === 'document' && !editingRecipe

    if (requiresAttachment && !payload.attachment) {
      push({
        title: 'Documento obrigatório',
        description: 'Anexe a ficha técnica em PDF, Excel ou Word.',
        variant: 'danger',
      })
      return
    }

    if (formMode === 'document' && editingRecipe && !payload.attachment && !hasExistingAttachment) {
      push({
        title: 'Documento obrigatório',
        description: 'Esta receita precisa de um documento anexado.',
        variant: 'danger',
      })
      return
    }

    const resolved = resolveRecipeFormValues(payload.values, payload.attachment)
    if (!resolved.success) {
      push({ title: 'Dados inválidos', description: resolved.error, variant: 'danger' })
      return
    }

    try {
      const saved = await saveRecipe({
        payload: {
          values: resolved.data,
          attachment: payload.attachment,
          removeExistingAttachment: payload.removeExistingAttachment ?? false,
        },
        ...(editingRecipe ? { recipeId: editingRecipe.id } : {}),
      })
      push({
        title: editingRecipe ? 'Receita atualizada' : 'Receita cadastrada',
        description: payload.attachment ? 'Documento anexado com sucesso.' : undefined,
        variant: 'success',
      })
      closeForm()
      navigate(`${APP_ROUTES.recipes}/${saved.id}`)
    } catch (error: unknown) {
      push({ title: 'Erro', description: getErrorMessage(error), variant: 'danger' })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={selectionMode ? 'pb-28 md:pb-0' : undefined}
    >
      <Breadcrumb items={[{ label: 'Início', href: APP_ROUTES.dashboard }, { label: 'Receitas' }]} />
      <PageHeader
        title="Receitas"
        description="Busque, filtre e organize fichas técnicas — otimizado para centenas de receitas."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {canSendToProduction ? (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  if (selectionMode) {
                    clearSelection()
                    return
                  }
                  setSelectionMode(true)
                }}
              >
                {selectionMode ? 'Cancelar seleção' : 'Selecionar receitas'}
              </Button>
            ) : null}
            {canManage ? (
              <Button onClick={openCreateChoice} className="w-full sm:w-auto">
                <Plus className="size-4" />
                Nova receita
              </Button>
            ) : null}
          </div>
        }
      />

      <RecipeKpisSection kpis={kpis} isLoading={isKpisLoading} />

      <RecipeFiltersBar
        filters={filters}
        total={total}
        isSearching={isSearching}
        searchHistory={searchHistory}
        onSearchChange={setSearch}
        onSelectSearchHistory={setSearch}
        onRemoveSearchHistory={removeSearchHistory}
        onClearSearchHistory={clearSearchHistory}
        onQuickFilterChange={setQuickFilter}
        onCategoryChange={(category) => setFilters({ category, page: 1 })}
        onSortByChange={setSortBy}
        onSortOrderToggle={toggleSortOrder}
      />

      {selectionMode && canSendToProduction ? (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-40 border-t border-border bg-surface-elevated p-4 pb-safe shadow-lg md:static md:bottom-auto md:mb-4 md:rounded-xl md:border md:shadow-none lg:bottom-auto">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedCount > 0
                ? `${selectedCount} receita(s) selecionada(s)`
                : 'Marque as receitas que deseja enviar para a produção.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectAllVisible}>
                Selecionar visíveis
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={selectedCount === 0}
                onClick={() => {
                  setIsSendDialogOpen(true)
                }}
              >
                <Send className="size-4" />
                Enviar para produção
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <RecipeList
        recipes={recipes}
        total={total}
        isLoading={isLoading}
        isMobile={isCompactList}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => void fetchNextPage()}
        selectionMode={selectionMode}
        isSelected={isSelected}
        onRecipeClick={(recipe) => navigate(`${APP_ROUTES.recipes}/${recipe.id}`)}
        onToggleSelection={toggleRecipe}
        onToggleFavorite={(recipe) => {
          void recipesService.toggleFavorite(recipe.id).then(() => {
            void queryClient.invalidateQueries({ queryKey: ['recipes'] })
          })
        }}
      />

      <Modal
        open={isCreateChoiceOpen}
        onClose={closeCreateChoice}
        title="Como deseja cadastrar?"
        description="Escolha a forma mais simples para a sua receita."
        size="md"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-xl border border-border p-4 text-left transition hover:border-accent hover:bg-accent/5"
            onClick={() => openCreateForm('document')}
          >
            <FileText className="mb-3 size-8 text-accent" />
            <p className="font-medium">Anexar ficha técnica</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ideal para PDF, Excel ou Word já prontos.
            </p>
          </button>
          <button
            type="button"
            className="rounded-xl border border-border p-4 text-left transition hover:border-accent hover:bg-accent/5"
            onClick={() => openCreateForm('manual')}
          >
            <ScrollText className="mb-3 size-8 text-accent" />
            <p className="font-medium">Cadastrar manualmente</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ingredientes e modo de preparo digitados no sistema.
            </p>
          </button>
        </div>
      </Modal>

      <Modal
        open={isFormOpen}
        onClose={closeForm}
        title={
          editingRecipe
            ? 'Editar receita'
            : formMode === 'document'
              ? 'Nova receita com documento'
              : 'Nova receita manual'
        }
        size="lg"
      >
        <RecipeForm
          recipe={editingRecipe}
          mode={formMode}
          canUploadDocument={canManage}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          isSaving={isSaving}
        />
      </Modal>

      <SendRecipesToProductionDialog
        open={isSendDialogOpen}
        recipes={selectedRecipes}
        isLoading={isSendingToProduction}
        onClose={() => {
          setIsSendDialogOpen(false)
        }}
        onConfirm={async (input) => {
          try {
            setIsSendingToProduction(true)
            await sendRecipesToProduction({
              recipes: selectedRecipes,
              ...input,
            })
            await queryClient.invalidateQueries({ queryKey: ['production'] })
            await queryClient.invalidateQueries({ queryKey: ['recipes'] })
            push({
              title: 'Receitas enviadas',
              description: `${selectedRecipes.length} receita(s) adicionada(s) à produção.`,
              variant: 'success',
            })
            clearSelection()
          } catch (error: unknown) {
            push({ title: 'Erro', description: getErrorMessage(error), variant: 'danger' })
          } finally {
            setIsSendingToProduction(false)
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(recipePendingDelete)}
        onClose={cancelDelete}
        onConfirm={async () => {
          try {
            await confirmDelete()
            push({ title: 'Receita removida', variant: 'success' })
          } catch (error: unknown) {
            push({ title: 'Erro', description: getErrorMessage(error), variant: 'danger' })
          }
        }}
        title="Remover receita"
        description={`Remover ${recipePendingDelete?.name}?`}
        confirmLabel="Remover"
        isConfirming={isDeleting}
        variant="danger"
      />
    </motion.div>
  )
}
