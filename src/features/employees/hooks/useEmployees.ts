import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateEmployeeInput,
  Employee,
  EmployeeFilters,
  EmployeeViewMode,
  UpdateEmployeeInput,
} from '@/features/employees/types/employee.types'
import { employeesService } from '@/features/employees/services/employees.service'
import { computeEmployeeKpis } from '@/features/employees/utils/computeEmployeeKpis'

const EMPLOYEES_QUERY_KEY = ['employees'] as const

const DEFAULT_FILTERS: EmployeeFilters = {
  search: '',
  sector: 'all',
  position: 'all',
  status: 'all',
}

export function useEmployees() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<EmployeeFilters>(DEFAULT_FILTERS)
  const [viewMode, setViewMode] = useState<EmployeeViewMode>('cards')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [employeePendingDelete, setEmployeePendingDelete] = useState<Employee | null>(null)

  const allEmployeesQuery = useQuery({
    queryKey: [...EMPLOYEES_QUERY_KEY, 'all'],
    queryFn: () => employeesService.list(),
  })

  const employeesQuery = useQuery({
    queryKey: [...EMPLOYEES_QUERY_KEY, 'filtered', filters],
    queryFn: () => employeesService.list(filters),
  })

  const kpis = useMemo(
    () => computeEmployeeKpis(allEmployeesQuery.data ?? []),
    [allEmployeesQuery.data],
  )

  const selectedEmployee = useMemo(() => {
    if (!selectedEmployeeId || !employeesQuery.data) {
      return null
    }
    return employeesQuery.data.find((item) => item.id === selectedEmployeeId) ?? null
  }, [employeesQuery.data, selectedEmployeeId])

  const createMutation = useMutation({
    mutationFn: (input: CreateEmployeeInput) => employeesService.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEmployeeInput }) =>
      employeesService.update(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeesService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY })
    },
  })

  return {
    employees: employeesQuery.data ?? [],
    kpis,
    isLoading: employeesQuery.isLoading,
    isKpisLoading: allEmployeesQuery.isLoading,
    isFetching: employeesQuery.isFetching,
    error: employeesQuery.error,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    selectedEmployee,
    selectedEmployeeId,
    selectEmployee: (id: string | null) => {
      setSelectedEmployeeId(id)
    },
    isFormOpen,
    editingEmployee,
    openCreateForm: () => {
      setEditingEmployee(null)
      setIsFormOpen(true)
    },
    openEditForm: (employee: Employee) => {
      setEditingEmployee(employee)
      setIsFormOpen(true)
    },
    closeForm: () => {
      setIsFormOpen(false)
      setEditingEmployee(null)
    },
    employeePendingDelete,
    requestDelete: (employee: Employee) => {
      setEmployeePendingDelete(employee)
    },
    cancelDelete: () => {
      setEmployeePendingDelete(null)
    },
    confirmDelete: async () => {
      if (!employeePendingDelete) {
        return
      }

      const id = employeePendingDelete.id
      await deleteMutation.mutateAsync(id)
      setEmployeePendingDelete(null)

      if (selectedEmployeeId === id) {
        setSelectedEmployeeId(null)
      }
    },
    createEmployee: createMutation.mutateAsync,
    updateEmployee: updateMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: employeesQuery.refetch,
  }
}

export type UseEmployeesReturn = ReturnType<typeof useEmployees>
