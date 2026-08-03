import { LineChart } from 'lucide-react'
import { Breadcrumb, EmptyState, PageHeader, PageShell } from '@/components/common'
import { Badge, Skeleton } from '@/components/ui'
import { InsightsSectionBlock } from '@/features/nannai-insights/components/InsightsSectionBlock'
import { useNannaiInsights } from '@/features/nannai-insights/hooks/useNannaiInsights'
import { APP_ROUTES } from '@/core/constants'

export function NannaiInsightsPage() {
  const { sections, isLoading, isError } = useNannaiInsights()

  return (
    <PageShell>
      <Breadcrumb
        items={[{ label: 'Início', href: APP_ROUTES.dashboard }, { label: 'NANNAI Insights' }]}
      />

      <PageHeader
        title="NANNAI Insights"
        description="Central de análises inteligentes da operação. Nesta etapa, apenas a estrutura está disponível para futuras implementações."
        actions={
          <Badge variant="accent" className="px-3 py-1.5 text-xs">
            Fase: estrutura
          </Badge>
        }
      />

      <div className="mb-8 rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-5 py-4 text-sm text-muted-foreground">
        Os cartões abaixo estão reservados para receber análises reais. Nenhum dado operacional é exibido
        nesta versão.
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<LineChart className="size-10" aria-hidden />}
          title="Não foi possível carregar a estrutura"
          description="Verifique sua conexão e tente novamente em instantes."
        />
      ) : sections.length === 0 ? (
        <EmptyState
          icon={<LineChart className="size-10" aria-hidden />}
          title="Nenhuma seção configurada"
          description="A estrutura do NANNAI Insights ainda não foi definida no servidor."
        />
      ) : (
        <div className="space-y-10">
          {sections.map((section) => (
            <InsightsSectionBlock key={section.id} section={section} />
          ))}
        </div>
      )}
    </PageShell>
  )
}
