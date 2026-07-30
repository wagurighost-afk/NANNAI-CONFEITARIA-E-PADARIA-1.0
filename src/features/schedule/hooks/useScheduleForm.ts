import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  scheduleFormSchema,
  type ScheduleFormSchema,
} from '@/features/schedule/schemas/schedule.schema'
import type { ScheduleEntry } from '@/features/schedule/types/schedule.types'

const EMPTY: ScheduleFormSchema = {
  employeeId: '',
  sector: 'Confeitaria',
  shift: 'Manhã',
  status: 'Ativo',
  notes: '',
}

function toValues(entry: ScheduleEntry | null): ScheduleFormSchema {
  if (!entry) {
    return EMPTY
  }
  return {
    employeeId: entry.employeeId,
    sector: entry.sector,
    shift: entry.shift,
    status: entry.status,
    notes: entry.notes,
  }
}

interface Options {
  entry: ScheduleEntry | null
  onSubmit: (values: ScheduleFormSchema) => Promise<void>
}

export function useScheduleForm({ entry, onSubmit }: Options) {
  const form = useForm<ScheduleFormSchema>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: toValues(entry),
  })

  useEffect(() => {
    form.reset(toValues(entry))
  }, [entry, form])

  return {
    form,
    handleSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
  }
}
