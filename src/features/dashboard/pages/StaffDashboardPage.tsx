import { Link } from 'react-router-dom'
import { PageShell } from '@/components/common/PageShell'
import { Breadcrumb, PageHeader } from '@/components/common'
import { ProgressBar } from '@/components/common/ProgressBar/ProgressBar'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { ProductionStatusBadge } from '@/features/production/components/ProductionStatusBadge'
import { useStaffDashboard } from '@/features/dashboard/hooks/useStaffDashboard'
import { APP_ROUTES, formatAppReferenceDateBr } from '@/core/constants'
import { formatDateTimeBr } from '@/utils/formatDate'

export function StaffDashboardPage() {
  const { employee, myProduction, mySchedule, myDaysOff, monthlySchedule, todayCleaning, popDocuments, recentComments, isLoading } =
    useStaffDashboard()

  if (isLoading) {
    return <Skeleton variant="rectangular" height={400} />
  }

  return (
    <PageShell>
      <Breadcrumb items={[{ label: 'Início' }]} />
      <PageHeader
        title={`Olá, ${employee?.name ?? 'Colaborador'}`}
        description="Sua produção, escala e procedimentos do turno."
        actions={
          <Link to={APP_ROUTES.production}>
            <Button variant="outline">Minha produção</Button>
          </Link>
        }
      />

      <div className="grid min-w-0 gap-4 [&>*]:min-w-0 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Minha produção</CardTitle>
            <CardDescription>{formatAppReferenceDateBr()}</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            {myProduction ? (
              <div className="min-w-0 space-y-3">
                <ProgressBar value={myProduction.progress} label="Progresso" />
                <ul className="space-y-2">
                  {myProduction.items.map((item) => (
                    <li key={item.id} className="flex min-w-0 items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                        {item.name}
                      </span>
                      <span className="shrink-0">
                        <ProductionStatusBadge status={item.status} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma produção atribuída hoje.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="min-w-0">Minha escala</CardTitle>
            <Link to={APP_ROUTES.schedule} className="shrink-0">
              <Button variant="outline" size="sm">
                Ver escala completa
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="min-w-0">
            {mySchedule ? (
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Setor:</span> {mySchedule.sector}
                </p>
                <p>
                  <span className="text-muted-foreground">Turno:</span> {mySchedule.shift}
                </p>
                <Badge variant={mySchedule.status === 'Ativo' ? 'success' : 'muted'}>
                  {mySchedule.status}
                </Badge>
                {monthlySchedule && myDaysOff.length > 0 ? (
                  <div className="min-w-0 rounded-xl border border-border bg-muted/20 p-3">
                    <p className="mb-2 break-words text-xs font-medium text-muted-foreground [overflow-wrap:anywhere]">
                      Minhas folgas em {monthlySchedule.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {myDaysOff.map((day) => (
                        <Badge key={day.day} variant="muted">
                          Dia {day.day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Escala não encontrada.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comentários do turno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentComments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem comentários.</p>
            ) : (
              recentComments.map((comment) => (
                <div key={comment.id} className="min-w-0 rounded-lg border border-border p-3 text-sm">
                  <p className="break-words [overflow-wrap:anywhere]">{comment.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <time dateTime={comment.createdAt}>{formatDateTimeBr(comment.createdAt)}</time>
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Escala de limpeza</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayCleaning.map((assignment) => (
              <div key={assignment.shift} className="min-w-0">
                <p className="text-sm font-medium">{assignment.shift}</p>
                <p className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                  {assignment.employeeNames.join(', ') || '—'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="min-w-0">POP</CardTitle>
            <Link to={APP_ROUTES.pop} className="shrink-0">
              <Button variant="outline" size="sm">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="grid min-w-0 gap-3 md:grid-cols-2">
            {popDocuments.slice(0, 4).map((doc) => (
              <div key={doc.id} className="min-w-0 rounded-xl border border-border p-3">
                <p className="break-words font-medium [overflow-wrap:anywhere]">{doc.title}</p>
                <p className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                  {doc.summary}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="min-w-0">Receitas</CardTitle>
            <Link to={APP_ROUTES.recipes} className="shrink-0">
              <Button variant="outline" size="sm">
                Consultar receitas
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Consulte fichas técnicas e modo de preparo no módulo de receitas.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
