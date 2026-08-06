import type {
  AssignmentPresenceStatus,
  AssignmentSector,
  WasteConferenceStatus,
} from '@/features/assignment/types/assignment.types'

export const ASSIGNMENT_SECTOR_LABELS: Record<AssignmentSector, string> = {
  confeitaria: 'Confeitaria',
  padaria: 'Padaria',
  cafe: 'Café da Manhã',
  cha: 'Chá da Tarde',
  jantar: 'Jantar',
}

export const ASSIGNMENT_PRESENCE_LABELS: Record<AssignmentPresenceStatus, string> = {
  present: 'Presente',
  interval: 'Intervalo',
  absent: 'Ausente',
  off: 'Folga',
  vacation: 'Férias',
  leave: 'Afastamento',
}

/** Cores de status conforme especificação. */
export const ASSIGNMENT_PRESENCE_STYLES: Record<
  AssignmentPresenceStatus,
  { dot: string; badge: string; emoji: string }
> = {
  present: {
    dot: 'bg-emerald-600',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    emoji: '🟢',
  },
  interval: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    emoji: '🟡',
  },
  absent: {
    dot: 'bg-red-600',
    badge: 'bg-red-50 text-red-800 border-red-200',
    emoji: '🔴',
  },
  off: {
    dot: 'bg-neutral-300',
    badge: 'bg-neutral-50 text-neutral-700 border-neutral-200',
    emoji: '⚪',
  },
  vacation: {
    dot: 'bg-sky-600',
    badge: 'bg-sky-50 text-sky-800 border-sky-200',
    emoji: '🔵',
  },
  leave: {
    dot: 'bg-neutral-800',
    badge: 'bg-neutral-100 text-neutral-800 border-neutral-300',
    emoji: '⚫',
  },
}

export const WASTE_CONFERENCE_STATUS_LABELS: Record<WasteConferenceStatus, string> = {
  aguardando_conferencia: 'Aguardando conferência',
  conferido: 'Conferido',
  necessita_revisao: 'Necessita revisão',
}

export const WASTE_CONFERENCE_STATUS_STYLES: Record<WasteConferenceStatus, string> = {
  aguardando_conferencia: 'bg-amber-50 text-amber-800 border-amber-200',
  conferido: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  necessita_revisao: 'bg-red-50 text-red-800 border-red-200',
}
