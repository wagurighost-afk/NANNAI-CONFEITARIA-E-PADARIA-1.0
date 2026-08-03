import { Crown } from 'lucide-react'
import { Breadcrumb, EmptyState, PageHeader, PageShell } from '@/components/common'
import { Skeleton } from '@/components/ui'
import { LaboratorioFeatureCard } from '@/features/laboratorio/components/LaboratorioFeatureCard'
import { LaboratorioFiltersBar } from '@/features/laboratorio/components/LaboratorioFiltersBar'
import {
  LaboratorioCategoryKpis,
  LaboratorioKpis,
} from '@/features/laboratorio/components/LaboratorioKpis'
import { LaboratorioModuleCard } from '@/features/laboratorio/components/LaboratorioModuleCard'
import { useLaboratorio } from '@/features/laboratorio/hooks/useLaboratorio'
import type { LaboratorioFeatureLifecycle } from '@/features/laboratorio/types/laboratorio.types'
import { APP_ROUTES } from '@/core/constants'
import { getErrorMessage } from '@/core/errors'
import { useToast } from '@/hooks'

export function LaboratorioPage() {
  const { push } = useToast()
  const {
    summary,
    modules,
    features,
    filters,
    setFilters,
    isLoading,
    isSaving,
    updateFeature,
    updateModule,
  } = useLaboratorio()

  const handleFeatureLifecycle = async (
    featureId: string,
    lifecycle: LaboratorioFeatureLifecycle,
  ) => {
    try {
      await updateFeature({ featureId, input: { lifecycle } })
      push({ title: 'Status atualizado', variant: 'success' })
    } catch (error: unknown) {
      push({
        title: 'Não foi possível atualizar',
        description: getErrorMessage(error),
        variant: 'danger',
      })
    }
  }

  const handleFeatureToggle = async (featureId: string, enabled: boolean) => {
    try {
      await updateFeature({ featureId, input: { enabled } })
    } catch (error: unknown) {
      push({
        title: 'Não foi possível alterar funcionalidade',
        description: getErrorMessage(error),
        variant: 'danger',
      })
    }
  }

  const handleModuleToggle = async (moduleId: string, enabled: boolean) => {
    try {
      await updateModule({ moduleId, enabled })
      push({
        title: enabled ? 'Módulo ativado' : 'Módulo desativado',
        variant: 'success',
      })
    } catch (error: unknown) {
      push({
        title: 'Não foi possível alterar módulo',
        description: getErrorMessage(error),
        variant: 'danger',
      })
    }
  }

  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'Laboratório NANNAI' },
        ]}
      />

      <PageHeader
        title="Laboratório NANNAI"
        description="Ambiente exclusivo de testes, betas e funcionalidades experimentais do sistema."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Crown className="size-4" aria-hidden />
            Administrador Master
          </span>
        }
      />

      <div className="mb-6 space-y-4">
        <LaboratorioKpis {...(summary ? { summary } : {})} isLoading={isLoading} />
        {summary ? <LaboratorioCategoryKpis summary={summary} /> : null}
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Módulos do sistema</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} variant="rectangular" height={120} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => (
              <LaboratorioModuleCard
                key={module.id}
                module={module}
                disabled={isSaving}
                onToggle={(enabled) => void handleModuleToggle(module.id, enabled)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Funcionalidades</h2>
          <LaboratorioFiltersBar filters={filters} modules={modules} onChange={setFilters} />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} variant="rectangular" height={220} />
            ))}
          </div>
        ) : features.length === 0 ? (
          <EmptyState
            title="Nenhuma funcionalidade encontrada"
            description="Ajuste os filtros ou a pesquisa para localizar itens do laboratório."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <LaboratorioFeatureCard
                key={feature.id}
                feature={feature}
                disabled={isSaving}
                onLifecycleChange={(lifecycle) =>
                  void handleFeatureLifecycle(feature.id, lifecycle)
                }
                onToggleEnabled={(enabled) => void handleFeatureToggle(feature.id, enabled)}
              />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  )
}
