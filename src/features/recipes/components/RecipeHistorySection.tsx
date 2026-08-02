import { History } from 'lucide-react'
import { CollapsibleSection, Skeleton } from '@/components/ui'
import type { RecipeHistoryEntry } from '@/features/recipes/hooks/useRecipeHistory'
import { formatDateTimeBr } from '@/utils/formatDate'
import { cn } from '@/utils/cn'

interface RecipeHistorySectionProps {
  entries: RecipeHistoryEntry[]
  isLoading?: boolean
  isAuditSource?: boolean
  kitchenMode?: boolean
  defaultOpen?: boolean
}

export function RecipeHistorySection({
  entries,
  isLoading = false,
  isAuditSource = false,
  kitchenMode = false,
  defaultOpen = false,
}: RecipeHistorySectionProps) {
  return (
    <CollapsibleSection
      title="Histórico de alterações"
      icon={<History className="size-5" />}
      defaultOpen={defaultOpen}
      kitchenMode={kitchenMode}
    >
      {isLoading ? (
        <Skeleton variant="rectangular" height={120} />
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum registro de alteração disponível.</p>
      ) : (
        <div className="space-y-3">
          {!isAuditSource ? (
            <p className="text-xs text-muted-foreground">
              Resumo básico. Histórico completo disponível para usuários com permissão de auditoria.
            </p>
          ) : null}
          <ol className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className={cn(
                  'rounded-xl border border-border bg-muted/20',
                  kitchenMode ? 'p-4' : 'p-3',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={cn('font-semibold text-foreground', kitchenMode && 'text-base')}>{entry.label}</p>
                  <time className="text-xs text-muted-foreground">{formatDateTimeBr(entry.createdAt)}</time>
                </div>
                <p className={cn('mt-1 text-muted-foreground', kitchenMode ? 'text-sm' : 'text-xs')}>
                  {entry.summary}
                </p>
                <p className="mt-2 text-xs font-medium text-foreground">{entry.actorName}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </CollapsibleSection>
  )
}
