import { Breadcrumb, PageHeader, PageShell } from '@/components/common'
import { NiimbotConnectionPanel } from '@/components/niimbot'
import { APP_ROUTES } from '@/core/constants'

/**
 * Stage 1 page: NIIMBOT B1 Bluetooth connection only (no printing).
 */
export function NiimbotConnectionPage() {
  return (
    <PageShell className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'NIIMBOT' },
        ]}
      />
      <PageHeader
        title="Conexão NIIMBOT B1"
        description="Etapa 1 — pareamento via Web Bluetooth. A impressão será implementada em uma etapa seguinte."
      />
      <NiimbotConnectionPanel />
    </PageShell>
  )
}
