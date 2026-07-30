import { Badge, Button, Drawer, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { IngredientCategoryBadge } from '@/features/ingredients/components/IngredientCategoryBadge'
import { IngredientStatusBadge } from '@/features/ingredients/components/IngredientStatusBadge'
import type { Ingredient } from '@/features/ingredients/types/ingredient.types'

export interface IngredientDrawerProps {
  ingredient: Ingredient | null
  open: boolean
  onClose: () => void
  onEdit: (ingredient: Ingredient) => void
  onDelete: (ingredient: Ingredient) => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function IngredientDrawer({
  ingredient,
  open,
  onClose,
  onEdit,
  onDelete,
}: IngredientDrawerProps) {
  if (!ingredient) {
    return (
      <Drawer open={open} onClose={onClose} title="Ingrediente">
        <p className="text-sm text-muted-foreground">
          Selecione um ingrediente para ver os detalhes.
        </p>
      </Drawer>
    )
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={ingredient.name}
      description={ingredient.ingredientCode}
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="danger"
            className="w-full sm:w-auto"
            onClick={() => {
              onDelete(ingredient)
            }}
          >
            Excluir
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              onEdit(ingredient)
            }}
          >
            Editar
          </Button>
        </div>
      }
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <IngredientStatusBadge status={ingredient.status} />
        <IngredientCategoryBadge category={ingredient.category} />
      </div>

      <Tabs defaultValue="info">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="recipes">Receitas</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-3 text-sm">
          <InfoRow label="Código" value={ingredient.ingredientCode} />
          <InfoRow label="Categoria" value={ingredient.category} />
          <InfoRow label="Fornecedor" value={ingredient.supplier} />
          <InfoRow label="Unidade" value={ingredient.unit} />
          <InfoRow label="Custo médio" value={formatCurrency(ingredient.averageCost)} />
          <InfoRow
            label="Estoque"
            value={`${ingredient.currentStock} (mín ${ingredient.minimumStock} / máx ${ingredient.maximumStock})`}
          />
          <InfoRow label="Validade" value={formatDate(ingredient.expirationDate)} />
          <InfoRow label="Lote" value={ingredient.lot} />
          <InfoRow label="Localização" value={ingredient.location} />
          <InfoRow label="Observações" value={ingredient.notes || '—'} />
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {ingredient.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem histórico registrado.</p>
          ) : (
            ingredient.history.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-surface p-3">
                <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="recipes" className="space-y-2">
          {ingredient.relatedRecipes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma receita relacionada.</p>
          ) : (
            ingredient.relatedRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="flex flex-col gap-2 rounded-xl border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm text-foreground">{recipe.name}</p>
                <Badge variant="muted">{recipe.sector}</Badge>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="movements" className="space-y-2">
          {ingredient.movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada.</p>
          ) : (
            ingredient.movements.map((movement) => (
              <div key={movement.id} className="rounded-xl border border-border px-3 py-2">
                <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium capitalize text-foreground">{movement.type}</p>
                  <span className="text-xs text-muted-foreground">{formatDate(movement.date)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {movement.quantity} {movement.unit} — {movement.note}
                </p>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </Drawer>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/70 py-2 sm:flex-row sm:justify-between sm:gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground sm:text-right">{value}</span>
    </div>
  )
}
