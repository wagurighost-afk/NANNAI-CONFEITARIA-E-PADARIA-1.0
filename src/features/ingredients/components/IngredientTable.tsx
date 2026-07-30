import { DataTable, type DataTableColumn } from '@/components/ui'
import { IngredientCategoryBadge } from '@/features/ingredients/components/IngredientCategoryBadge'
import { IngredientStatusBadge } from '@/features/ingredients/components/IngredientStatusBadge'
import type { Ingredient } from '@/features/ingredients/types/ingredient.types'

export interface IngredientTableProps {
  ingredients: readonly Ingredient[]
  isLoading?: boolean
  onSelect: (ingredient: Ingredient) => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function IngredientTable({
  ingredients,
  isLoading = false,
  onSelect,
}: IngredientTableProps) {
  const columns: DataTableColumn<Ingredient>[] = [
    {
      id: 'code',
      header: 'Código',
      cell: (row) => (
        <span className="font-medium tabular-nums text-foreground">{row.ingredientCode}</span>
      ),
    },
    {
      id: 'name',
      header: 'Ingrediente',
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="truncate text-xs text-muted-foreground">{row.supplier}</p>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Categoria',
      cell: (row) => <IngredientCategoryBadge category={row.category} />,
    },
    {
      id: 'stock',
      header: 'Estoque',
      cell: (row) => `${row.currentStock} ${row.unit}`,
    },
    {
      id: 'cost',
      header: 'Custo médio',
      cell: (row) => formatCurrency(row.averageCost),
      align: 'right',
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <IngredientStatusBadge status={row.status} />,
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={[...ingredients]}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyMessage="Nenhum ingrediente encontrado com os filtros atuais."
      onRowClick={onSelect}
    />
  )
}
