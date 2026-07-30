import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { FileText, Plus, ScrollText, Send } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Breadcrumb, EmptyState, PageHeader } from '@/components/common'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  ConfirmDialog,
  Drawer,
  Modal,
  SearchInput,
  Select,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import { RecipeAttachmentsList } from '@/features/recipes/components/RecipeDocumentViewer'
import { RecipeForm } from '@/features/recipes/components/RecipeForm'
import { RecipeReadableView } from '@/features/recipes/components/RecipeReadableView'
import { SendRecipesToProductionDialog } from '@/features/recipes/components/SendRecipesToProductionDialog'
import { RecipeKpisSection } from '@/features/recipes/components/RecipeKpis'
import { useRecipeBatchSelection } from '@/features/recipes/hooks/useRecipeBatchSelection'
import { useRecipes } from '@/features/recipes/hooks/useRecipes'
import { sendRecipesToProduction } from '@/features/recipes/services/sendRecipesToProduction'
import { RECIPE_CATEGORIES, RECIPE_STATUSES } from '@/features/recipes/types/recipe.types'
import type { RecipeFormSubmitPayload } from '@/features/recipes/types/recipe.types'
import { getRecipeAttachmentBadge } from '@/features/recipes/utils/getRecipeAttachmentLabel'
import { isRecipeDocumentPrimary } from '@/features/recipes/utils/isRecipeDocumentPrimary'
import { resolveRecipeFormValues } from '@/features/recipes/utils/resolveRecipeFormValues'
import { APP_ROUTES } from '@/core/constants'
import { getErrorMessage } from '@/core/errors'
import { canManageOperationalData } from '@/core/permissions/systemAccess'
import { usePermission } from '@/hooks/usePermission'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks'

export function RecipesPage() {
  const { recipeId: recipeIdParam } = useParams()
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
    kpis,
    isLoading,
    isKpisLoading,
    filters,
    setFilters,
    selectedRecipe,
    isSelectedRecipeLoading,
    selectRecipe,
    isFormOpen,
    isCreateChoiceOpen,
    formMode,
    editingRecipe,
    openCreateChoice,
    closeCreateChoice,
    openCreateForm,
    openEditForm,
    closeForm,
    recipePendingDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    saveRecipe,
    archiveRecipe,
    isSaving,
    isDeleting,
    isArchiving,
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

  const drawerOpen = Boolean(selectedRecipe) || isSelectedRecipeLoading

  useEffect(() => {
    if (recipeIdParam) {
      selectRecipe(recipeIdParam)
    }
  }, [recipeIdParam, selectRecipe])

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
      selectRecipe(saved.id)
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
        description="Consulte fichas técnicas anexadas ou receitas cadastradas manualmente."
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
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <SearchInput
          placeholder="Buscar receita..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onClear={() => setFilters({ ...filters, search: '' })}
        />
        <Select
          options={[{ value: 'all', label: 'Todas categorias' }, ...RECIPE_CATEGORIES.map((c) => ({ value: c, label: c }))]}
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value as typeof filters.category })}
        />
        <Select
          options={[{ value: 'all', label: 'Todos status' }, ...RECIPE_STATUSES.map((s) => ({ value: s, label: s }))]}
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as typeof filters.status })}
        />
      </div>
      {selectionMode && canSendToProduction ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-elevated p-4 shadow-lg md:static md:mb-4 md:rounded-xl md:border md:shadow-none">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedCount > 0
                ? `${selectedCount} receita(s) selecionada(s)`
                : 'Marque as receitas que deseja enviar para a produção.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectAllVisible}>
                Selecionar todas
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
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={160} />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <EmptyState title="Nenhuma receita encontrada" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recipes.map((recipe) => {
            const attachmentBadge = getRecipeAttachmentBadge(recipe)
            const documentPrimary = isRecipeDocumentPrimary(recipe)

            return (
              <Card
                key={recipe.id}
                className={`cursor-pointer hover:shadow-md ${isSelected(recipe.id) ? 'ring-2 ring-accent' : ''}`}
                onClick={() => {
                  if (selectionMode) {
                    toggleRecipe(recipe.id)
                    return
                  }
                  selectRecipe(recipe.id)
                }}
              >
                <CardContent className="space-y-2 pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      {selectionMode ? (
                        <div
                          onClick={(event) => {
                            event.stopPropagation()
                          }}
                        >
                          <Checkbox
                            checked={isSelected(recipe.id)}
                            onChange={() => {
                              toggleRecipe(recipe.id)
                            }}
                            aria-label={`Selecionar ${recipe.name}`}
                          />
                        </div>
                      ) : null}
                      <p className="font-medium">{recipe.name}</p>
                    </div>
                    <Badge variant={recipe.status === 'Ativa' ? 'success' : 'muted'}>{recipe.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {recipe.category}
                    {!documentPrimary ? ` · ${recipe.prepTimeMinutes} min · ${recipe.yield}` : ' · Ficha anexa'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="muted">{recipe.recipeCode}</Badge>
                    {attachmentBadge ? <Badge variant="accent">Ficha {attachmentBadge}</Badge> : null}
                    {!attachmentBadge ? <Badge variant="muted">Cadastro manual</Badge> : null}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => selectRecipe(null)}
        title={selectedRecipe?.name ?? 'Carregando receita...'}
        description={selectedRecipe?.recipeCode}
        size="lg"
      >
        {isSelectedRecipeLoading && !selectedRecipe ? (
          <div className="space-y-3">
            <Skeleton variant="rectangular" height={120} />
            <Skeleton variant="rectangular" height={280} />
          </div>
        ) : null}
        {selectedRecipe ? (
          <div className="space-y-6">
            {selectedRecipe.attachments.length > 0 ? (
              <Tabs defaultValue="sheet">
                <TabsList className="w-full">
                  <TabsTrigger value="sheet" className="flex-1">
                    Ficha
                  </TabsTrigger>
                  <TabsTrigger value="document" className="flex-1">
                    Documento original
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="sheet">
                  <RecipeReadableView recipe={selectedRecipe} />
                </TabsContent>

                <TabsContent value="document">
                  <p className="mb-3 text-sm text-muted-foreground md:hidden">
                    No celular, use a aba Ficha para leitura fácil. Aqui você pode abrir o arquivo
                    original em tela cheia.
                  </p>
                  <div className="hidden md:block">
                    <RecipeAttachmentsList attachments={selectedRecipe.attachments} />
                  </div>
                  <div className="md:hidden">
                    <RecipeAttachmentsList attachments={selectedRecipe.attachments} compact />
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <RecipeReadableView recipe={selectedRecipe} />
            )}

            {canManage ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    selectRecipe(null)
                    openEditForm(selectedRecipe)
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isArchiving}
                  onClick={async () => {
                    await archiveRecipe(selectedRecipe.id)
                    push({ title: 'Receita arquivada', variant: 'success' })
                  }}
                >
                  Arquivar
                </Button>
                <Button variant="danger" size="sm" onClick={() => requestDelete(selectedRecipe)}>
                  Remover
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>

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
