import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Breadcrumb, PageHeader } from '@/components/common'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Checkbox, Skeleton } from '@/components/ui'
import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'
import { EMPLOYEE_SHIFTS } from '@/features/employees/types/employee.types'
import { useCleaningSchedule } from '@/features/cleaning-schedule/hooks/useCleaningSchedule'
import type { CleaningAssignment, WeekDay } from '@/features/cleaning-schedule/types/cleaningSchedule.types'
import { WEEK_DAYS } from '@/features/cleaning-schedule/types/cleaningSchedule.types'
import { APP_ROUTES } from '@/core/constants'
import { getErrorMessage } from '@/core/errors'
import { usePermission } from '@/hooks/usePermission'
import { useToast } from '@/hooks'

const EMPLOYEE_OPTIONS = EMPLOYEES_MOCK.filter((e) => e.status === 'Ativo').map((e) => ({
  value: e.id,
  label: e.name,
}))

export function CleaningSchedulePage() {
  const { hasPermission } = usePermission()
  const canManage = hasPermission('cleaning-schedule:manage')
  const { push } = useToast()
  const { schedule, isLoading, updateDay, isSaving } = useCleaningSchedule()
  const [selectedDay, setSelectedDay] = useState<WeekDay>('Segunda')
  const [draft, setDraft] = useState<CleaningAssignment[]>([])

  const daySchedule = useMemo(
    () => schedule?.days.find((d) => d.weekDay === selectedDay),
    [schedule, selectedDay],
  )

  const startEdit = () => {
    setDraft(daySchedule?.assignments ?? [])
  }

  const handleSave = async () => {
    try {
      await updateDay({ weekDay: selectedDay, assignments: draft })
      push({ title: 'Escala de limpeza salva', variant: 'success' })
    } catch (error: unknown) {
      push({ title: 'Erro', description: getErrorMessage(error), variant: 'danger' })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'Escala de Limpeza' },
        ]}
      />
      <PageHeader
        title="Escala de Limpeza"
        description="Distribuição semanal de limpeza por turno."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {WEEK_DAYS.map((day) => (
          <Button
            key={day}
            variant={selectedDay === day ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedDay(day)
              setDraft([])
            }}
          >
            {day}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton variant="rectangular" height={240} />
      ) : (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{selectedDay}</CardTitle>
            {canManage ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={startEdit}>
                  Editar
                </Button>
                <Button size="sm" isLoading={isSaving} onClick={handleSave} disabled={draft.length === 0}>
                  Salvar
                </Button>
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {(draft.length > 0 ? draft : daySchedule?.assignments ?? []).map((assignment, index) => (
              <div key={`${assignment.shift}-${index}`} className="rounded-xl border border-border p-4">
                <p className="mb-2 text-sm font-medium">{assignment.shift}</p>
                {canManage && draft.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {EMPLOYEE_OPTIONS.map((employee) => {
                      const checked = assignment.employeeIds.includes(employee.value)
                      return (
                        <Checkbox
                          key={employee.value}
                          label={employee.label}
                          checked={checked}
                          onChange={(event) => {
                            setDraft((prev) =>
                              prev.map((item, i) => {
                                if (i !== index) {
                                  return item
                                }
                                const nextIds = event.target.checked
                                  ? [...item.employeeIds, employee.value]
                                  : item.employeeIds.filter((id) => id !== employee.value)
                                return {
                                  ...item,
                                  employeeIds: nextIds,
                                  employeeNames: nextIds.map(
                                    (id) =>
                                      EMPLOYEES_MOCK.find((e) => e.id === id)?.name ?? 'Colaborador',
                                  ),
                                }
                              }),
                            )
                          }}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {assignment.employeeNames.map((name) => (
                      <Badge key={name} variant="muted">
                        {name}
                      </Badge>
                    ))}
                    {assignment.employeeNames.length === 0 ? (
                      <span className="text-sm text-muted-foreground">Sem colaboradores</span>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
            {canManage && draft.length === 0 ? (
              <Button
                variant="outline"
                onClick={() => {
                  setDraft(
                    EMPLOYEE_SHIFTS.slice(0, 2).map((shift) => ({
                      shift,
                      employeeIds: [],
                      employeeNames: [],
                    })),
                  )
                }}
              >
                Configurar turnos
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
