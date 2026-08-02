import { Breadcrumb, PageHeader, PageShell } from '@/components/common'
import { NiimbotPrintTestPanel } from '@/components/niimbot/NiimbotPrintTestPanel'
import { APP_ROUTES } from '@/core/constants'

/**
 * Dedicated screen for NIIMBOT test printing.
 * Not integrated with Produção.
 */
export function NiimbotPrintTestPage() {
  return (
    <PageShell className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'NIIMBOT', href: APP_ROUTES.niimbotSettings },
          { label: 'Teste da Impressora' },
        ]}
      />
      <PageHeader
        title="Teste da Impressora"
        description="Imprima uma etiqueta de teste na NIIMBOT B1 para validar a conexão e o envio. Sem vínculo com Produção."
      />
      <NiimbotPrintTestPanel />
    </PageShell>
  )
}
