import { Star } from 'lucide-react'
import { Badge, Checkbox, DataTable } from '@/components/ui'
import type { DataTableColumn } from '@/components/ui/DataTable'
import type { Recipe } from '@/features/recipes/types/recipe.types'
import { getRecipeAttachmentBadge } from '@/features/recipes/utils/getRecipeAttachmentLabel'
import { formatDateTimeBr } from '@/utils/formatDate'
import { cn } from '@/utils/cn'

interface RecipeTableProps {
  recipes: Recipe[]
  isLoading?: boolean
  selectionMode?: boolean
  isSelected: (id: string) => boolean
  onRowClick: (recipe: Recipe) => void
  onToggleSelection: (id: string) => void
  onToggleFavorite: (recipe: Recipe) => void
}

export function RecipeTable({
  recipes,
  isLoading = false,
  selectionMode = false,
  isSelected,
  onRowClick,
  onToggleSelection,
  onToggleFavorite,
}: RecipeTableProps) {
  const columns: DataTableColumn<Recipe>[] = [
    ...(selectionMode
      ? [
          {
            id: 'select',
            header: '',
            className: 'w-10',
            cell: (row: Recipe) => (
              <div
                onClick={(event) => {
                  event.stopPropagation()
                }}
              >
                <Checkbox
                  checked={isSelected(row.id)}
                  onChange={() => onToggleSelection(row.id)}
                  aria-label={`Selecionar ${row.name}`}
                />
              </div>
            ),
          } satisfies DataTableColumn<Recipe>,
        ]
      : []),
    {
      id: 'favorite',
      header: '',
      className: 'w-10',
      cell: (row) => (
        <button
          type="button"
          className="rounded-lg p-1.5 text-muted-foreground transition hover:text-accent"
          aria-label={row.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          onClick={(event) => {
            event.stopPropagation()
            onToggleFavorite(row)
          }}
        >
          <Star className={cn('size-4', row.isFavorite && 'fill-accent text-accent')} />
        </button>
      ),
    },
    {
      id: 'name',
      header: 'Receita',
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.recipeCode}</p>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Categoria',
      cell: (row) => row.category,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <Badge variant={row.status === 'Ativa' ? 'success' : 'muted'}>{row.status}</Badge>,
    },
    {
      id: 'attachment',
      header: 'Tipo',
      cell: (row) => {
        const badge = getRecipeAttachmentBadge(row)
        return badge ? <Badge variant="accent">Ficha {badge}</Badge> : <Badge variant="muted">Manual</Badge>
      },
    },
    {
      id: 'usage',
      header: 'Usos',
      align: 'right',
      cell: (row) => row.usageCount ?? 0,
    },
    {
      id: 'updatedAt',
      header: 'Atualizada',
      cell: (row) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTimeBr(row.updatedAt)}</span>,
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={recipes}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyMessage="Nenhuma receita encontrada"
      onRowClick={(row) => {
        if (selectionMode) {
          onToggleSelection(row.id)
          return
        }
        onRowClick(row)
      }}
    />
  )
}
