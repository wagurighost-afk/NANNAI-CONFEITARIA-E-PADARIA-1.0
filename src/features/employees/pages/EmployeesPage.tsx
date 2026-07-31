import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { Breadcrumb, EmptyState, PageHeader } from '@/components/common'
import { Button, ConfirmDialog, Modal } from '@/components/ui'
import { EmployeeCard } from '@/features/employees/components/EmployeeCard'
import { EmployeeFiltersBar } from '@/features/employees/components/EmployeeFiltersBar'
import { EmployeeForm } from '@/features/employees/components/EmployeeForm'
import { EmployeeKpisSection } from '@/features/employees/components/EmployeeKpis'
import { EmployeeProfileDrawer } from '@/features/employees/components/EmployeeProfileDrawer'
import { EmployeeTable } from '@/features/employees/components/EmployeeTable'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import type { EmployeeFormSubmitPayload } from '@/features/employees/components/EmployeeForm'
import type { Employee } from '@/features/employees/types/employee.types'
import { useToast } from '@/hooks'
import { getErrorMessage } from '@/core/errors'
import { APP_ROUTES } from '@/core/constants'

export function EmployeesPage() {
  const {
    employees,
    kpis,
    isLoading,
    isKpisLoading,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    selectedEmployee,
    selectEmployee,
    isFormOpen,
    editingEmployee,
    openCreateForm,
    openEditForm,
    closeForm,
    createEmployee,
    updateEmployee,
    isSaving,
    employeePendingDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    isDeleting,
    updateEmployeePhoto,
    isUpdatingPhoto,
  } = useEmployees()

  const { push } = useToast()

  const handleFormSubmit = async (values: EmployeeFormSubmitPayload) => {
    try {
      if (editingEmployee) {
        await updateEmployee({ id: editingEmployee.id, input: values })
        push({
          title: 'Colaborador atualizado',
          description: values.name,
          variant: 'success',
        })
      } else {
        await createEmployee(values)
        push({
          title: 'Colaborador cadastrado',
          description: values.name,
          variant: 'success',
        })
      }
      closeForm()
    } catch (error: unknown) {
      push({
        title: 'Não foi possível salvar',
        description: getErrorMessage(error),
        variant: 'danger',
      })
    }
  }

  const handleConfirmDelete = async () => {
    const name = employeePendingDelete?.name
    try {
      await confirmDelete()
      push({
        title: 'Colaborador removido',
        description: name,
        variant: 'success',
      })
    } catch (error: unknown) {
      push({
        title: 'Não foi possível excluir',
        description: getErrorMessage(error),
        variant: 'danger',
      })
    }
  }

  const openEmployee = (employee: Employee) => {
    selectEmployee(employee.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="pb-4"
    >
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'Colaboradores' },
        ]}
      />

      <PageHeader
        title="Colaboradores"
        description="Base da equipe Nannai para produção, escalas, checklists e permissões."
        actions={
          <Button onClick={openCreateForm} className="w-full sm:w-auto">
            <Plus className="size-4" />
            Novo colaborador
          </Button>
        }
      />

      <EmployeeKpisSection kpis={kpis} isLoading={isKpisLoading} />

      <div className="mb-5">
        <EmployeeFiltersBar
          filters={filters}
          viewMode={viewMode}
          onFiltersChange={setFilters}
          onViewModeChange={setViewMode}
        />
      </div>

      {!isLoading && employees.length === 0 ? (
        <EmptyState
          title="Nenhum colaborador encontrado"
          description="Ajuste os filtros ou cadastre um novo membro da equipe."
          action={
            <Button onClick={openCreateForm}>
              <Plus className="size-4" />
              Cadastrar
            </Button>
          }
        />
      ) : (
        <>
          {/* Mobile / tablet: cards em grid responsivo */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {isLoading
              ? null
              : employees.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onSelect={openEmployee}
                  />
                ))}
          </div>

          {/* Desktop: tabela ou cards conforme toggle */}
          <div className="hidden lg:block">
            {viewMode === 'table' ? (
              <EmployeeTable
                employees={employees}
                isLoading={isLoading}
                onSelect={openEmployee}
              />
            ) : (
              <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-4 lg:grid-cols-2">
                {employees.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onSelect={openEmployee}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <EmployeeProfileDrawer
        open={selectedEmployee !== null}
        employee={selectedEmployee}
        onClose={() => {
          selectEmployee(null)
        }}
        onEdit={(employee) => {
          selectEmployee(null)
          openEditForm(employee)
        }}
        onDelete={(employee) => {
          requestDelete(employee)
        }}
        onPhotoChange={async (employeeId, file) => {
          await updateEmployeePhoto({ id: employeeId, file })
          push({
            title: 'Foto atualizada',
            description: selectedEmployee?.name,
            variant: 'success',
          })
        }}
        isUpdatingPhoto={isUpdatingPhoto}
      />

      <Modal
        open={isFormOpen}
        onClose={closeForm}
        title={editingEmployee ? 'Editar colaborador' : 'Novo colaborador'}
        description="Preencha os dados do membro da equipe. O domínio do e-mail segue a regra do cargo."
        size="lg"
      >
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSaving={isSaving}
        />
      </Modal>

      <ConfirmDialog
        open={employeePendingDelete !== null}
        onClose={cancelDelete}
        onConfirm={() => {
          void handleConfirmDelete()
        }}
        title="Excluir colaborador"
        description={
          employeePendingDelete
            ? `Remover ${employeePendingDelete.name} da equipe? Esta ação não pode ser desfeita no mock atual.`
            : undefined
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isConfirming={isDeleting}
      />
    </motion.div>
  )
}
