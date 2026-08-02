import { useQuery } from '@tanstack/react-query'
import { fetchAuditLogs } from '@/features/audit/services/audit.service'
import { AUDIT_ACTION_LABELS } from '@/features/audit/constants/audit.constants'
import type { AuditLogRecord } from '@/features/audit/types/audit.types'
import type { Recipe } from '@/features/recipes/types/recipe.types'

export interface RecipeHistoryEntry {
  id: string
  label: string
  summary: string
  actorName: string
  createdAt: string
}

function mapAuditLog(log: AuditLogRecord): RecipeHistoryEntry {
  return {
    id: log.id,
    label: AUDIT_ACTION_LABELS[log.action],
    summary: log.summary,
    actorName: log.actor.userName,
    createdAt: log.createdAt,
  }
}

function buildFallbackHistory(recipe: Recipe): RecipeHistoryEntry[] {
  const entries: RecipeHistoryEntry[] = [
    {
      id: 'created',
      label: 'Cadastro',
      summary: `Receita ${recipe.recipeCode} cadastrada`,
      actorName: 'Sistema',
      createdAt: recipe.createdAt,
    },
  ]

  if (recipe.updatedAt !== recipe.createdAt) {
    entries.push({
      id: 'updated',
      label: 'Atualização',
      summary: 'Última alteração registrada',
      actorName: 'Sistema',
      createdAt: recipe.updatedAt,
    })
  }

  if (recipe.lastUsedAt) {
    entries.push({
      id: 'used',
      label: 'Uso em produção',
      summary: `Utilizada ${recipe.usageCount ?? 1} vez(es) na produção`,
      actorName: 'Sistema',
      createdAt: recipe.lastUsedAt,
    })
  }

  return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function useRecipeHistory(recipe: Recipe | null, canViewAudit: boolean) {
  const auditQuery = useQuery({
    queryKey: ['recipe', 'history', recipe?.id],
    queryFn: () =>
      fetchAuditLogs({
        entityType: 'recipe',
        entityId: recipe!.id,
        limit: 20,
        offset: 0,
      }),
    enabled: Boolean(recipe && canViewAudit),
    staleTime: 30_000,
  })

  const entries: RecipeHistoryEntry[] = recipe
    ? canViewAudit && auditQuery.data?.items.length
      ? auditQuery.data.items.map(mapAuditLog)
      : buildFallbackHistory(recipe)
    : []

  return {
    entries,
    isLoading: canViewAudit && auditQuery.isLoading,
    isAuditSource: Boolean(canViewAudit && auditQuery.data?.items.length),
  }
}
