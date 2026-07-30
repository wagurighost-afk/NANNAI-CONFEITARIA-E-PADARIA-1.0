import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
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
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Minha produção</CardTitle>
            <CardDescription>{formatAppReferenceDateBr()}</CardDescription>
          </CardHeader>
          <CardContent>
            {myProduction ? (
              <div className="space-y-3">
                <ProgressBar value={myProduction.progress} label="Progresso" />
                <ul className="space-y-2">
                  {myProduction.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                      <span>{item.name}</span>
                      <ProductionStatusBadge status={item.status} />
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
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Minha escala</CardTitle>
            <Link to={APP_ROUTES.schedule}>
              <Button variant="outline" size="sm">
                Ver escala completa
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
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
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
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
                <div key={comment.id} className="rounded-lg border border-border p-3 text-sm">
                  <p>{comment.message}</p>
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
              <div key={assignment.shift}>
                <p className="text-sm font-medium">{assignment.shift}</p>
                <p className="text-sm text-muted-foreground">
                  {assignment.employeeNames.join(', ') || '—'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>POP</CardTitle>
            <Link to={APP_ROUTES.pop}>
              <Button variant="outline" size="sm">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {popDocuments.slice(0, 4).map((doc) => (
              <div key={doc.id} className="rounded-xl border border-border p-3">
                <p className="font-medium">{doc.title}</p>
                <p className="text-sm text-muted-foreground">{doc.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Receitas</CardTitle>
            <Link to={APP_ROUTES.recipes}>
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
    </motion.div>
  )
}
