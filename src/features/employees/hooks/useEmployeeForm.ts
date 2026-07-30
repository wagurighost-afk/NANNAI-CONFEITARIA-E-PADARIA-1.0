import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  employeeFormSchema,
  type EmployeeFormSchema,
} from '@/features/employees/schemas/employee.schema'
import type { Employee } from '@/features/employees/types/employee.types'
import { generateCorporateEmail } from '@/features/employees/utils/employeeEmail'

const EMPTY_VALUES: EmployeeFormSchema = {
  name: '',
  email: '',
  phone: '',
  photoUrl: '',
  position: 'Confeiteiro',
  sector: 'Confeitaria',
  shift: 'Manhã',
  status: 'Ativo',
  admissionDate: '',
  notes: '',
}

function toFormValues(employee: Employee | null): EmployeeFormSchema {
  if (!employee) {
    return EMPTY_VALUES
  }

  return {
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    photoUrl: employee.photoUrl ?? '',
    position: employee.position,
    sector: employee.sector,
    shift: employee.shift,
    status: employee.status,
    admissionDate: employee.admissionDate,
    notes: employee.notes ?? '',
  }
}

interface UseEmployeeFormOptions {
  employee: Employee | null
  onSubmit: (values: EmployeeFormSchema) => Promise<void>
}

export function useEmployeeForm({ employee, onSubmit }: UseEmployeeFormOptions) {
  const form = useForm<EmployeeFormSchema>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: toFormValues(employee),
  })

  useEffect(() => {
    form.reset(toFormValues(employee))
  }, [employee, form])

  const position = form.watch('position')
  const name = form.watch('name')

  useEffect(() => {
    if (employee) {
      return
    }

    if (name.trim().length < 3) {
      return
    }

    const suggested = generateCorporateEmail(name, position)
    form.setValue('email', suggested, { shouldValidate: true })
  }, [employee, name, position, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return {
    form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
  }
}
