import { Breadcrumb, PageHeader, PageShell } from '@/components/common'
import { NiimbotSettingsPanel } from '@/components/niimbot/NiimbotSettingsPanel'
import { APP_ROUTES } from '@/core/constants'

/**
 * Printer settings screen: persist, auto-reconnect, change/disconnect, view info.
 * Printing is intentionally out of scope.
 */
export function NiimbotSettingsPage() {
  return (
    <PageShell className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'NIIMBOT', href: APP_ROUTES.niimbot },
          { label: 'Configurações' },
        ]}
      />
      <PageHeader
        title="Configurações da impressora"
        description="Gerencie a NIIMBOT B1: reconexão automática, troca de dispositivo e informações da conexão. A impressão virá em uma etapa seguinte."
      />
      <NiimbotSettingsPanel />
    </PageShell>
  )
}
