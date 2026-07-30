import { appDateTimeAt } from '@/core/constants/appDate'
import type { CleaningSchedule } from '@/features/cleaning-schedule/types/cleaningSchedule.types'

/** Escala de limpeza conforme apresentação Nannai 2025. */
const EQUIPE_MANHA = [
  'emp-hosana',
  'emp-larissa',
  'emp-silvana',
  'emp-adriana',
  'emp-williamys',
  'emp-luciano',
] as const

const EQUIPE_MANHA_NAMES = [
  'Hosana da Conceição',
  'Larissa Maximiano',
  'Silvana',
  'Adriana dos Santos',
  'Wiliamys Monteiro',
  'Luciano Marcelino',
] as const

const EQUIPE_TARDE = [
  'emp-mauro',
  'emp-helena',
  'emp-matheus',
  'emp-rafaela',
  'emp-thayse',
  'emp-romario',
  'emp-vinicius',
  'emp-paulo',
] as const

const EQUIPE_TARDE_NAMES = [
  'Mauro José',
  'Maria Helena',
  'Mateus da Silva',
  'Jessica Rafaela',
  'Thayse Brunele',
  'Romario Tributino',
  'Glaydson Vinicius',
  'Paulo Ricardo',
] as const

function teamAssignment(shift: 'Manhã' | 'Tarde') {
  if (shift === 'Manhã') {
    return {
      shift,
      employeeIds: [...EQUIPE_MANHA],
      employeeNames: [...EQUIPE_MANHA_NAMES],
    }
  }
  return {
    shift,
    employeeIds: [...EQUIPE_TARDE],
    employeeNames: [...EQUIPE_TARDE_NAMES],
  }
}

export const CLEANING_SCHEDULE_MOCK: CleaningSchedule = {
  id: 'cls-001',
  updatedAt: appDateTimeAt(21, 6),
  days: [
    { weekDay: 'Segunda', assignments: [teamAssignment('Tarde')] },
    { weekDay: 'Terça', assignments: [teamAssignment('Manhã')] },
    { weekDay: 'Quarta', assignments: [teamAssignment('Tarde')] },
    { weekDay: 'Quinta', assignments: [teamAssignment('Manhã')] },
    { weekDay: 'Sexta', assignments: [teamAssignment('Tarde')] },
    {
      weekDay: 'Sábado',
      assignments: [
        {
          shift: 'Integral',
          employeeIds: [...EQUIPE_MANHA, ...EQUIPE_TARDE],
          employeeNames: [...EQUIPE_MANHA_NAMES, ...EQUIPE_TARDE_NAMES],
        },
      ],
    },
    {
      weekDay: 'Domingo',
      assignments: [
        {
          shift: 'Integral',
          employeeIds: [...EQUIPE_MANHA, ...EQUIPE_TARDE],
          employeeNames: [...EQUIPE_MANHA_NAMES, ...EQUIPE_TARDE_NAMES],
        },
      ],
    },
  ],
}
