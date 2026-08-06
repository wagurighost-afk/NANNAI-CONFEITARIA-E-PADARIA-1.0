import { Breadcrumb, PageHeader, PageShell } from '@/components/common'
import { BrandLogo } from '@/components/brand'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { APP_VERSION } from '@/core/constants/appVersion'
import { BRAND } from '@/core/constants/brand'
import { APP_ROUTES } from '@/core/constants'

export function AboutPage() {
  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'Sobre' },
        ]}
      />

      <PageHeader
        title="Sobre o sistema"
        description={BRAND.description}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <Card className="border-accent/20">
          <CardContent className="pt-6">
            <BrandLogo variant="full" showSystemName />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Identidade</CardTitle>
              <CardDescription>Marca oficial NANNAI — {BRAND.location}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="font-medium text-foreground">Nome:</span> {BRAND.name}
              </p>
              <p>
                <span className="font-medium text-foreground">Subtítulo:</span> {BRAND.subtitle}
              </p>
              <p>
                <span className="font-medium text-foreground">Sistema:</span> {BRAND.systemName}
              </p>
              <p>
                <span className="font-medium text-foreground">Versão:</span> {APP_VERSION}
              </p>
              <p className="pt-2 text-accent">{BRAND.motto}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Áreas operacionais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-medium text-foreground">Confeitaria</p>
                <p className="mt-1 text-muted-foreground">Produção, receitas e conferência diária.</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-medium text-foreground">Padaria</p>
                <p className="mt-1 text-muted-foreground">Controle de pães e operação de forno.</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-medium text-foreground">Gestão e qualidade</p>
                <p className="mt-1 text-muted-foreground">Indicadores, auditoria e padronização.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
