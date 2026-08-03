import { useState } from 'react'
import { Bug } from 'lucide-react'
import { Breadcrumb, EmptyState, PageHeader, PageShell } from '@/components/common'
import { Card, CardContent, Skeleton } from '@/components/ui'
import { BugCard } from '@/features/bugs/components/BugCard'
import { BugDetailDrawer } from '@/features/bugs/components/BugDetailDrawer'
import { BugFiltersBar } from '@/features/bugs/components/BugFiltersBar'
import { BugReportForm } from '@/features/bugs/components/BugReportForm'
import { useBugs } from '@/features/bugs/hooks/useBugs'
import type { BugReport, BugStatus, CreateBugFormInput } from '@/features/bugs/types/bug.types'
import { APP_ROUTES } from '@/core/constants'
import { canManageBugStatus } from '@/core/permissions/bugsAccess'
import { getErrorMessage } from '@/core/errors'
import { useAuth, useToast } from '@/hooks'

export function BugsPage() {
  const { user } = useAuth()
  const { push } = useToast()
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null)

  const {
    bugs,
    total,
    summary,
    modules,
    filters,
    setFilters,
    isLoading,
    isSubmitting,
    isUpdatingStatus,
    createBug,
    updateStatus,
  } = useBugs()

  const canManage = canManageBugStatus(user)

  const handleCreate = async (input: CreateBugFormInput) => {
    if (!user) {
      return
    }

    try {
      await createBug({
        ...input,
        reportedById: user.id,
        reportedByName: user.name,
        reportedByEmail: user.email,
      })
      push({ title: 'Bug reportado com sucesso', variant: 'success' })
    } catch (error: unknown) {
      push({
        title: 'Não foi possível reportar',
        description: getErrorMessage(error),
        variant: 'danger',
      })
      throw error
    }
  }

  const handleUpdateStatus = async (status: BugStatus, note?: string) => {
    if (!selectedBug) {
      return
    }

    try {
      const updated = await updateStatus({
        id: selectedBug.id,
        status,
        ...(note ? { note } : {}),
      })
      setSelectedBug(updated)
      push({ title: 'Status atualizado', variant: 'success' })
    } catch (error: unknown) {
      push({
        title: 'Não foi possível atualizar',
        description: getErrorMessage(error),
        variant: 'danger',
      })
    }
  }

  return (
    <PageShell>
      <Breadcrumb
        items={[{ label: 'Início', href: APP_ROUTES.dashboard }, { label: 'Central de Bugs' }]}
      />

      <PageHeader
        title="Central de Bugs"
        description="Reporte problemas do sistema, acompanhe o status e consulte o histórico de correções."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Total" value={summary.total} />
        <Kpi label="Abertos" value={summary.aberto} />
        <Kpi label="Em análise" value={summary.emAnalise} />
        <Kpi label="Corrigindo" value={summary.corrigindo} />
        <Kpi label="Resolvidos" value={summary.resolvido} />
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <BugReportForm
            modules={modules}
            isSubmitting={isSubmitting}
            onSubmit={handleCreate}
          />
        </CardContent>
      </Card>

      <div className="mb-6">
        <BugFiltersBar filters={filters} modules={modules} onChange={setFilters} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : bugs.length === 0 ? (
        <EmptyState
          icon={<Bug className="size-10" aria-hidden />}
          title="Nenhum bug encontrado"
          description={
            total === 0
              ? 'Seja o primeiro a reportar um problema no sistema.'
              : 'Ajuste os filtros ou a busca para encontrar outros registros.'
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bugs.map((bug) => (
            <BugCard key={bug.id} bug={bug} onClick={() => setSelectedBug(bug)} />
          ))}
        </div>
      )}

      <BugDetailDrawer
        bug={selectedBug}
        open={Boolean(selectedBug)}
        canManageStatus={canManage}
        isUpdatingStatus={isUpdatingStatus}
        onClose={() => setSelectedBug(null)}
        {...(canManage ? { onUpdateStatus: handleUpdateStatus } : {})}
      />
    </PageShell>
  )
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}
