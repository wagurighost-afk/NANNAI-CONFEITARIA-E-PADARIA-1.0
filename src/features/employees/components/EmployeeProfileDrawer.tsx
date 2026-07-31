import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { Badge, Button, Drawer, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { EmployeeAvatar } from '@/features/employees/components/EmployeeAvatar'
import { EmployeeStatusBadge } from '@/features/employees/components/EmployeeStatusBadge'
import { EmployeeDaysOffPanel } from '@/features/schedule/components/EmployeeDaysOffPanel'
import { monthlyScheduleService } from '@/features/schedule/services/monthlySchedule.service'
import {
  EMPLOYEE_PHOTO_ACCEPT,
  EMPLOYEE_PHOTO_MAX_SIZE,
  EMPLOYEE_PHOTO_MAX_SIZE_LABEL,
} from '@/features/employees/constants/employeePhoto.constants'
import type { Employee } from '@/features/employees/types/employee.types'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/utils/cn'

export interface EmployeeProfileDrawerProps {
  employee: Employee | null
  open: boolean
  onClose: () => void
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  onPhotoChange?: (employeeId: string, file: File) => Promise<void>
  isUpdatingPhoto?: boolean
}

export function EmployeeProfileDrawer({
  employee,
  open,
  onClose,
  onEdit,
  onDelete,
  onPhotoChange,
  isUpdatingPhoto = false,
}: EmployeeProfileDrawerProps) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

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

  const handlePhotoPick = async (file: File | null) => {
    if (!file || !onPhotoChange) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setPhotoError('Selecione apenas imagens (JPG, PNG ou WebP).')
      return
    }

    if (file.size > EMPLOYEE_PHOTO_MAX_SIZE) {
      setPhotoError(`A foto deve ter no máximo ${EMPLOYEE_PHOTO_MAX_SIZE_LABEL}.`)
      return
    }

    setPhotoError(null)

    try {
      await onPhotoChange(employee.id, file)
    } catch {
      setPhotoError('Não foi possível atualizar a foto.')
    } finally {
      if (photoInputRef.current) {
        photoInputRef.current.value = ''
      }
    }
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
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <button
            type="button"
            disabled={!onPhotoChange || isUpdatingPhoto}
            onClick={() => {
              photoInputRef.current?.click()
            }}
            className={cn(
              'group relative rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
              onPhotoChange && !isUpdatingPhoto ? 'cursor-pointer' : 'cursor-default',
            )}
            aria-label="Alterar foto do colaborador"
          >
            <EmployeeAvatar employee={employee} size="lg" className="size-20 text-xl" />
            {onPhotoChange && !isUpdatingPhoto ? (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition group-hover:bg-black/35">
                <Camera className="size-5 text-white opacity-0 transition group-hover:opacity-100" />
              </span>
            ) : null}
          </button>
          {onPhotoChange ? (
            <p className="text-center text-xs text-muted-foreground sm:text-left">
              Toque na foto para alterar
            </p>
          ) : null}
          {photoError ? <p className="text-xs text-danger">{photoError}</p> : null}
          <input
            ref={photoInputRef}
            type="file"
            accept={EMPLOYEE_PHOTO_ACCEPT}
            capture="environment"
            className="sr-only"
            disabled={!onPhotoChange || isUpdatingPhoto}
            onChange={(event) => {
              void handlePhotoPick(event.target.files?.[0] ?? null)
            }}
          />
        </div>
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
