import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'

export interface DataTableColumn<TRow> {
  id: string
  header: string
  cell: (row: TRow) => ReactNode
  className?: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
}

export type DataTableSortDirection = 'asc' | 'desc'

export interface DataTableProps<TRow> {
  columns: readonly DataTableColumn<TRow>[]
  data: readonly TRow[]
  getRowId: (row: TRow) => string
  isLoading?: boolean
  emptyMessage?: string
  sortColumnId?: string
  sortDirection?: DataTableSortDirection
  onSort?: (columnId: string) => void
  onRowClick?: (row: TRow) => void
  className?: string
}

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

export function DataTable<TRow>({
  columns,
  data,
  getRowId,
  isLoading = false,
  emptyMessage = 'Nenhum registro encontrado.',
  sortColumnId,
  sortDirection = 'asc',
  onSort,
  onRowClick,
  className,
}: DataTableProps<TRow>) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-sm',
        className,
      )}
    >
      <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 scrollbar-thin sm:mx-0 sm:px-0">
        <table className="w-full min-w-full border-collapse text-sm sm:min-w-[640px]">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((column) => {
                const align = column.align ?? 'left'
                const isSorted = sortColumnId === column.id

                return (
                  <th
                    key={column.id}
                    scope="col"
                    className={cn(
                      'px-4 py-3 font-medium text-muted-foreground',
                      alignClasses[align],
                      column.className,
                    )}
                    aria-sort={
                      column.sortable && isSorted
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    {column.sortable && onSort ? (
                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center gap-1 rounded-md px-1 hover:text-foreground sm:min-h-0"
                        onClick={() => {
                          onSort(column.id)
                        }}
                      >
                        {column.header}
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="size-3.5" aria-hidden />
                          ) : (
                            <ArrowDown className="size-3.5" aria-hidden />
                          )
                        ) : null}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, rowIndex) => (
                  <tr key={`skeleton-${rowIndex}`} className="border-t border-border">
                    {columns.map((column) => (
                      <td key={column.id} className="px-4 py-3">
                        <Skeleton variant="text" />
                      </td>
                    ))}
                  </tr>
                ))
              : null}

            {!isLoading && data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? data.map((row) => (
                  <tr
                    key={getRowId(row)}
                    className={cn(
                      'border-t border-border transition-colors hover:bg-muted/40',
                      onRowClick && 'cursor-pointer',
                    )}
                    onClick={() => {
                      onRowClick?.(row)
                    }}
                    onKeyDown={(event) => {
                      if (!onRowClick) {
                        return
                      }
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onRowClick(row)
                      }
                    }}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? 'button' : undefined}
                  >
                    {columns.map((column) => {
                      const align = column.align ?? 'left'
                      return (
                        <td
                          key={column.id}
                          className={cn(
                            'px-4 py-3 text-foreground',
                            alignClasses[align],
                            column.className,
                          )}
                        >
                          {column.cell(row)}
                        </td>
                      )
                    })}
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
