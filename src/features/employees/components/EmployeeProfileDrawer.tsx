import { Badge, Button, Drawer, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { EmployeeAvatar } from '@/features/employees/components/EmployeeAvatar'
import { EmployeeStatusBadge } from '@/features/employees/components/EmployeeStatusBadge'
import { EmployeeDaysOffPanel } from '@/features/schedule/components/EmployeeDaysOffPanel'
import { monthlyScheduleService } from '@/features/schedule/services/monthlySchedule.service'
import type { Employee } from '@/features/employees/types/employee.types'
import { useQuery } from '@tanstack/react-query'

export interface EmployeeProfileDrawerProps {
  employee: Employee | null
  open: boolean
  onClose: () => void
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}

export function EmployeeProfileDrawer({
  employee,
  open,
  onClose,
  onEdit,
  onDelete,
}: EmployeeProfileDrawerProps) {
  const monthlyScheduleQuery = useQuery({
    queryKey: ['monthly-schedule', 2026, 7],
    queryFn: () => monthlyScheduleService.getByYearMonth(2026, 7),
    enabled: open && Boolean(employee),
  })

  if (!employee) {
    return (
      <Drawer open={open} onClose={onClose} title="Colaborador">
        <p className="text-sm text-muted-foreground">
          Selecione um colaborador para ver os detalhes.
        </p>
      </Drawer>
    )
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={employee.name}
      description={`${employee.position} · ${employee.sector}`}
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="danger"
            className="w-full sm:w-auto"
            onClick={() => {
              onDelete(employee)
            }}
          >
            Excluir
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              onEdit(employee)
            }}
          >
            Editar cadastro
          </Button>
        </div>
      }
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <EmployeeAvatar employee={employee} size="lg" />
        <div className="min-w-0 space-y-2">
          <EmployeeStatusBadge status={employee.status} />
          <p className="truncate text-sm text-muted-foreground">{employee.email}</p>
          <p className="text-sm text-muted-foreground">{employee.phone}</p>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="productions">Produções</TabsTrigger>
          <TabsTrigger value="folgas">Folgas</TabsTrigger>
          <TabsTrigger value="checklists">Checklists</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-3 text-sm">
          <InfoRow label="Cargo" value={employee.position} />
          <InfoRow label="Setor" value={employee.sector} />
          <InfoRow label="Turno" value={employee.shift} />
          <InfoRow label="Admissão" value={formatDate(employee.admissionDate)} />
          <InfoRow label="Observações" value={employee.notes ?? '—'} />
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {employee.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem histórico registrado.</p>
          ) : (
            employee.history.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-surface p-3">
                <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="productions" className="space-y-2">
          {employee.productions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma produção atribuída.</p>
          ) : (
            employee.productions.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-xl border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm text-foreground">{item.name}</p>
                <Badge variant="muted">{item.target}</Badge>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="folgas">
          <EmployeeDaysOffPanel
            schedule={monthlyScheduleQuery.data ?? null}
            employeeId={employee.id}
            employeeName={employee.name}
          />
        </TabsContent>

        <TabsContent value="checklists" className="space-y-2">
          {employee.checklists.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum checklist vinculado.</p>
          ) : (
            employee.checklists.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-xl border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm text-foreground">{item.title}</p>
                <Badge variant={item.status === 'Concluído' ? 'success' : 'accent'}>
                  {item.status}
                </Badge>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </Drawer>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/70 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground sm:text-right">{value}</span>
    </div>
  )
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('pt-BR').format(date)
}
