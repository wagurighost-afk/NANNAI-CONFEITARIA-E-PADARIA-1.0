import { Plus, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Breadcrumb, EmptyState, PageHeader } from '@/components/common'
import { Badge, Button, Card, CardContent, ConfirmDialog, Modal, SearchInput, Select, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { EMPLOYEE_SECTORS, EMPLOYEE_SHIFTS, EMPLOYEE_STATUSES } from '@/features/employees/types/employee.types'
import { MonthlyScheduleSection } from '@/features/schedule/components/MonthlyScheduleSection'
import { ScheduleForm } from '@/features/schedule/components/ScheduleForm'
import { ScheduleKpisSection } from '@/features/schedule/components/ScheduleKpis'
import { useSchedule } from '@/features/schedule/hooks/useSchedule'
import type { ScheduleFormSchema } from '@/features/schedule/schemas/schedule.schema'
import { APP_ROUTES } from '@/core/constants'
import { getErrorMessage } from '@/core/errors'
import { usePermission } from '@/hooks/usePermission'
import { useToast } from '@/hooks'

export function SchedulePage() {
  const { hasPermission } = usePermission()
  const canManage = hasPermission('schedule:manage')
  const { push } = useToast()
  const {
    entries,
    kpis,
    isLoading,
    isKpisLoading,
    filters,
    setFilters,
    isFormOpen,
    editingEntry,
    openCreateForm,
    openEditForm,
    closeForm,
    entryPendingDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    createEntry,
    updateEntry,
    isSaving,
    isDeleting,
  } = useSchedule()

  const handleSubmit = async (values: ScheduleFormSchema) => {
    try {
      if (editingEntry) {
        await updateEntry({ id: editingEntry.id, input: values })
        push({ title: 'Escala atualizada', variant: 'success' })
      } else {
        await createEntry(values)
        push({ title: 'Colaborador adicionado à escala', variant: 'success' })
      }
      closeForm()
    } catch (error: unknown) {
      push({ title: 'Erro', description: getErrorMessage(error), variant: 'danger' })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Breadcrumb items={[{ label: 'Início', href: APP_ROUTES.dashboard }, { label: 'Escala' }]} />
      <PageHeader
        title="Escala"
        description="Escala mensal de folgas, turnos e status da equipe."
        actions={
          canManage ? (
            <Button onClick={openCreateForm} className="w-full sm:w-auto">
              <Plus className="size-4" />
              Adicionar colaborador
            </Button>
          ) : undefined
        }
      />

      <Tabs defaultValue="monthly" className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="monthly">Escala do mês</TabsTrigger>
          <TabsTrigger value="status">Status da equipe</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <MonthlyScheduleSection canManage={canManage} />
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
      <ScheduleKpisSection kpis={kpis} isLoading={isKpisLoading} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SearchInput
          placeholder="Buscar colaborador..."
          value={filters.search}
          onChange={(e) => {
            setFilters({ ...filters, search: e.target.value })
          }}
          onClear={() => {
            setFilters({ ...filters, search: '' })
          }}
        />
        <Select
          options={[{ value: 'all', label: 'Todos os setores' }, ...EMPLOYEE_SECTORS.map((s) => ({ value: s, label: s }))]}
          value={filters.sector}
          onChange={(e) => {
            setFilters({ ...filters, sector: e.target.value as typeof filters.sector })
          }}
        />
        <Select
          options={[{ value: 'all', label: 'Todos os turnos' }, ...EMPLOYEE_SHIFTS.map((s) => ({ value: s, label: s }))]}
          value={filters.shift}
          onChange={(e) => {
            setFilters({ ...filters, shift: e.target.value as typeof filters.shift })
          }}
        />
        <Select
          options={[{ value: 'all', label: 'Todos os status' }, ...EMPLOYEE_STATUSES.map((s) => ({ value: s, label: s }))]}
          value={filters.status}
          onChange={(e) => {
            setFilters({ ...filters, status: e.target.value as typeof filters.status })
          }}
        />
      </div>
      {isLoading ? (
        <Skeleton variant="rectangular" height={300} />
      ) : entries.length === 0 ? (
        <EmptyState title="Nenhum registro de escala" />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{entry.employeeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.sector} · {entry.shift}
                    </p>
                  </div>
                  <Badge variant={entry.status === 'Ativo' ? 'success' : 'muted'}>
                    {entry.status}
                  </Badge>
                </div>
                {entry.notes ? (
                  <p className="text-sm text-muted-foreground">{entry.notes}</p>
                ) : null}
                {canManage ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditForm(entry)}>
                      <Pencil className="size-4" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => requestDelete(entry)}>
                      <Trash2 className="size-4" />
                      Remover
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </TabsContent>
      </Tabs>
      <Modal open={isFormOpen} onClose={closeForm} title={editingEntry ? 'Editar escala' : 'Adicionar à escala'}>
        <ScheduleForm entry={editingEntry} onSubmit={handleSubmit} onCancel={closeForm} isSaving={isSaving} />
      </Modal>
      <ConfirmDialog
        open={Boolean(entryPendingDelete)}
        onClose={cancelDelete}
        onConfirm={async () => {
          try {
            await confirmDelete()
            push({ title: 'Removido da escala', variant: 'success' })
          } catch (error: unknown) {
            push({ title: 'Erro', description: getErrorMessage(error), variant: 'danger' })
          }
        }}
        title="Remover da escala"
        description={`Remover ${entryPendingDelete?.employeeName} da escala?`}
        confirmLabel="Remover"
        isConfirming={isDeleting}
        variant="danger"
      />
    </motion.div>
  )
}
