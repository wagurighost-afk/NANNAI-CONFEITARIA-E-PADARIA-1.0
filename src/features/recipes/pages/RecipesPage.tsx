import { FileSpreadsheet, FileText, Plus, ScrollText } from 'lucide-react'
import { motion } from 'framer-motion'
import { Breadcrumb, EmptyState, PageHeader } from '@/components/common'
import {
  Badge,
  Button,
  Card,
  CardContent,
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
import { RecipeKpisSection } from '@/features/recipes/components/RecipeKpis'
import { useRecipes } from '@/features/recipes/hooks/useRecipes'
import { RECIPE_CATEGORIES, RECIPE_STATUSES, type Recipe } from '@/features/recipes/types/recipe.types'
import type { RecipeFormSubmitPayload } from '@/features/recipes/types/recipe.types'
import { getRecipeAttachmentBadge } from '@/features/recipes/utils/getRecipeAttachmentLabel'
import { isRecipeDocumentPrimary } from '@/features/recipes/utils/isRecipeDocumentPrimary'
import { resolveRecipeFormValues } from '@/features/recipes/utils/resolveRecipeFormValues'
import { APP_ROUTES } from '@/core/constants'
import { getErrorMessage } from '@/core/errors'
import { usePermission } from '@/hooks/usePermission'
import { useToast } from '@/hooks'
import { formatDateTimeBr } from '@/utils/formatDate'

export function RecipesPage() {
  const { hasPermission } = usePermission()
  const canManage = hasPermission('recipes:manage')
  const { push } = useToast()
  const {
    recipes,
    kpis,
    isLoading,
    isKpisLoading,
    filters,
    setFilters,
    selectedRecipe,
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

  const selectedIsDocumentPrimary = selectedRecipe ? isRecipeDocumentPrimary(selectedRecipe) : false

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Breadcrumb items={[{ label: 'Início', href: APP_ROUTES.dashboard }, { label: 'Receitas' }]} />
      <PageHeader
        title="Receitas"
        description="Consulte fichas técnicas anexadas ou receitas cadastradas manualmente."
        actions={
          canManage ? (
            <Button onClick={openCreateChoice} className="w-full sm:w-auto">
              <Plus className="size-4" />
              Nova receita
            </Button>
          ) : undefined
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
                className="cursor-pointer hover:shadow-md"
                onClick={() => selectRecipe(recipe.id)}
              >
                <CardContent className="space-y-2 pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{recipe.name}</p>
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
        open={Boolean(selectedRecipe)}
        onClose={() => selectRecipe(null)}
        title={selectedRecipe?.name ?? ''}
        description={selectedRecipe?.recipeCode}
        size={selectedRecipe?.attachments.length ? 'full' : 'lg'}
      >
        {selectedRecipe ? (
          <div className="space-y-6">
            {selectedRecipe.attachments.length > 0 ? (
              <Tabs defaultValue="document">
                <TabsList>
                  <TabsTrigger value="document">Documento</TabsTrigger>
                  <TabsTrigger value="info">Informações</TabsTrigger>
                </TabsList>

                <TabsContent value="document">
                  <RecipeAttachmentsList attachments={selectedRecipe.attachments} />
                </TabsContent>

                <TabsContent value="info">
                  <RecipeInfoPanel recipe={selectedRecipe} documentPrimary={selectedIsDocumentPrimary} />
                </TabsContent>
              </Tabs>
            ) : (
              <RecipeInfoPanel recipe={selectedRecipe} documentPrimary={false} />
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

function RecipeInfoPanel({
  recipe,
  documentPrimary,
}: {
  recipe: Recipe
  documentPrimary: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-3 text-sm">
          <p className="text-muted-foreground">Categoria</p>
          <p className="font-medium">{recipe.category}</p>
        </div>
        <div className="rounded-xl border border-border p-3 text-sm">
          <p className="text-muted-foreground">Status</p>
          <p className="font-medium">{recipe.status}</p>
        </div>
      </div>

      {documentPrimary ? (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
            <FileSpreadsheet className="size-4" />
            Conteúdo completo no documento
          </div>
          Ingredientes, rendimento e modo de preparo estão na ficha anexa. Abra a aba{' '}
          <span className="font-medium text-foreground">Documento</span> para consultar.
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border p-3 text-sm">
            <p className="text-muted-foreground">Tempo · Rendimento</p>
            <p className="font-medium">
              {recipe.prepTimeMinutes} min · {recipe.yield}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Modo de preparo</p>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {recipe.preparationMethod}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Ingredientes</p>
            <ul className="space-y-1 text-sm">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="rounded-lg border border-border px-3 py-2">
                  {ing.quantity} {ing.unit} — {ing.name}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {recipe.notes ? (
        <div>
          <p className="mb-2 text-sm font-medium">Observações</p>
          <p className="text-sm text-muted-foreground">{recipe.notes}</p>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Atualizado em {formatDateTimeBr(recipe.updatedAt)}
      </p>
    </div>
  )
}
