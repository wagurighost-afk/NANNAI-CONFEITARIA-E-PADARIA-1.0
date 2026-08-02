import type { WasteBuffetType, WastePhase } from '@/features/waste-control/types/wasteControl.types'

export const WASTE_BUFFET_LABELS: Record<WasteBuffetType, string> = {
  cafe: 'Café da Manhã',
  cha: 'Chá da Tarde',
  jantar: 'Jantar',
}

export const WASTE_PHASE_LABELS: Record<WastePhase, string> = {
  entrada: 'Entrada',
  reposicao: 'Reposição',
  finalizacao: 'Finalização',
}

export const WASTE_PHASES: WastePhase[] = ['entrada', 'reposicao', 'finalizacao']

export const WASTE_BUFFETS: WasteBuffetType[] = ['cafe', 'cha', 'jantar']
