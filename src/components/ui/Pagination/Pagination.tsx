import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  /** Visible page number buttons around current page */
  siblingCount?: number
}

function buildPageList(page: number, totalPages: number, siblingCount: number): Array<number | 'ellipsis'> {
  if (totalPages <= 1) {
    return totalPages === 1 ? [1] : []
  }

  const pages = new Set<number>()
  pages.add(1)
  pages.add(totalPages)

  for (let i = page - siblingCount; i <= page + siblingCount; i += 1) {
    if (i >= 1 && i <= totalPages) {
      pages.add(i)
    }
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const result: Array<number | 'ellipsis'> = []

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index]
    if (current === undefined) {
      continue
    }

    const previous = sorted[index - 1]
    if (previous !== undefined && current - previous > 1) {
      result.push('ellipsis')
    }
    result.push(current)
  }

  return result
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
  siblingCount = 1,
}: PaginationProps) {
  if (totalPages <= 0) {
    return null
  }

  const items = buildPageList(page, totalPages, siblingCount)
  const canGoPrev = page > 1
  const canGoNext = page < totalPages

  return (
    <nav aria-label="Paginação" className={cn('flex items-center gap-1', className)}>
      <Button
        variant="outline"
        size="sm"
        disabled={!canGoPrev}
        onClick={() => {
          onPageChange(page - 1)
        }}
        aria-label="Página anterior"
      >
        <ChevronLeft className="size-4" />
      </Button>

      {items.map((item, index) =>
        item === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 text-sm text-muted-foreground"
            aria-hidden
          >
            …
          </span>
        ) : (
          <Button
            key={item}
            variant={item === page ? 'primary' : 'ghost'}
            size="sm"
            aria-label={`Página ${item}`}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => {
              onPageChange(item)
            }}
          >
            {item}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={!canGoNext}
        onClick={() => {
          onPageChange(page + 1)
        }}
        aria-label="Próxima página"
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  )
}
