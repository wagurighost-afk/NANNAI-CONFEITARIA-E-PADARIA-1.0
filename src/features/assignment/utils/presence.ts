import type { AssignmentPresenceStatus } from '@/features/assignment/types/assignment.types'

export function monthlyStatusToPresence(
  status: 'work' | 'off' | 'vacation' | 'leave' | 'other' | null | undefined,
): AssignmentPresenceStatus | null {
  if (!status) {
    return null
  }
  if (status === 'work') {
    return 'present'
  }
  if (status === 'off') {
    return 'off'
  }
  if (status === 'vacation') {
    return 'vacation'
  }
  if (status === 'leave') {
    return 'leave'
  }
  return 'absent'
}

export function dailyStatusToPresence(
  status: string,
  notes?: string,
): AssignmentPresenceStatus | null {
  const normalizedNotes = notes?.toLowerCase() ?? ''
  if (normalizedNotes.includes('intervalo')) {
    return 'interval'
  }
  if (status === 'Ativo') {
    return 'present'
  }
  if (status === 'Folga') {
    return 'off'
  }
  if (status === 'Férias') {
    return 'vacation'
  }
  if (status === 'Afastado') {
    return 'leave'
  }
  return null
}

/**
 * Combina escala mensal e diária.
 * Ausências da diária/mensal sempre vencem; só "presente" é selecionável.
 */
export function mergePresence(
  monthly: AssignmentPresenceStatus | null,
  daily: AssignmentPresenceStatus | null,
): AssignmentPresenceStatus {
  const blockers: AssignmentPresenceStatus[] = ['off', 'vacation', 'leave', 'absent', 'interval']
  for (const status of blockers) {
    if (daily === status || monthly === status) {
      return status
    }
  }
  if (daily === 'present' || monthly === 'present') {
    return 'present'
  }
  return 'absent'
}

export function isPresenceSelectable(presence: AssignmentPresenceStatus): boolean {
  return presence === 'present'
}
