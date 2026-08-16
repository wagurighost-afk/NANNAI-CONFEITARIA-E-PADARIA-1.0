import { Link } from 'react-router-dom'
import { PageShell } from '@/components/common/PageShell'
import { Breadcrumb, PageHeader } from '@/components/common'
import { ProgressBar } from '@/components/common/ProgressBar/ProgressBar'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, KpiCard, Skeleton } from '@/components/ui'
import { ChefBreadMonthlySummaryCard } from '@/features/bread-control/components/ChefBreadMonthlySummaryCard'
import { ChefWasteTodayCard } from '@/features/waste-control/components/ChefWasteTodayCard'
import { useChefDashboard } from '@/features/dashboard/hooks/useChefDashboard'
import { APP_ROUTES, formatAppReferenceDateBr } from '@/core/constants'
import { formatDateTimeBr } from '@/utils/formatDate'
import { ChefHat, ClipboardList, MessageSquare, Users } from 'lucide-react'

export function ChefDashboardPage() {
  const {
    productions,
    employeeProgress,
    recentComments,
    activeSchedule,
    todayCleaning,
    todayWeekDay,
    recipeKpis,
    isLoading,
  } = useChefDashboard()

  if (isLoading) {
    return <Skeleton variant="rectangular" height={400} />
  }

  return (
    <PageShell>
      <Breadcrumb items={[{ label: 'Início' }]} />
      <PageHeader
        title="Dashboard Chef"
        description="Visão operacional do dia — produção, equipe e receitas."
        actions={
          <Link to={APP_ROUTES.production}>
            <Button variant="outline">Ver produção</Button>
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-3 [&>*]:min-w-0 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Produções hoje" value={productions.length} icon={<ClipboardList className="size-5" />} />
        <KpiCard label="Equipe ativa" value={activeSchedule.length} icon={<Users className="size-5" />} />
        <KpiCard label="Receitas ativas" value={recipeKpis.active} icon={<ChefHat className="size-5" />} />
        <KpiCard label="Comentários" value={recentComments.length} icon={<MessageSquare className="size-5" />} />
      </div>

      <div className="grid min-w-0 gap-4 [&>*]:min-w-0 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produção do dia</CardTitle>
            <CardDescription>{formatAppReferenceDateBr()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {productions.map((production) => (
              <div key={production.id} className="rounded-xl border border-border p-3">
                <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate font-medium">{production.employeeName}</p>
                  <Badge variant="muted" className="shrink-0">{production.shift}</Badge>
                </div>
                <ProgressBar value={production.progress} label="Progresso" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {production.items.map((i) => i.name).join(' · ')}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progresso por colaborador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {employeeProgress.map((entry) => (
              <ProgressBar
                key={entry.employeeName}
                value={entry.progress}
                label={`${entry.employeeName} (${entry.shift})`}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comentários recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentComments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem comentários.</p>
            ) : (
              recentComments.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-border p-3 text-sm">
                  <p>{comment.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{comment.authorName}</span>
                    <span className="mx-1">·</span>
                    <time dateTime={comment.createdAt}>{formatDateTimeBr(comment.createdAt)}</time>
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Escala do dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeSchedule.slice(0, 8).map((entry) => (
              <div key={entry.id} className="flex min-w-0 items-center justify-between gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{entry.employeeName}</span>
                <Badge variant="muted" className="shrink-0">{entry.shift}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <ChefBreadMonthlySummaryCard />
        <ChefWasteTodayCard />

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Escala de limpeza — {todayWeekDay}</CardTitle>
          </CardHeader>
          <CardContent className="grid min-w-0 gap-3 [&>*]:min-w-0 sm:grid-cols-2">
            {todayCleaning.map((assignment) => (
              <div key={assignment.shift} className="rounded-xl border border-border p-3">
                <p className="mb-2 font-medium">{assignment.shift}</p>
                <div className="flex flex-wrap gap-2">
                  {assignment.employeeNames.map((name) => (
                    <Badge key={name} variant="accent">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
