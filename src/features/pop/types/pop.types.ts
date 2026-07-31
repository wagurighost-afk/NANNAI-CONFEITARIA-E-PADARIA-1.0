export type PopCategory = 'abertura' | 'fechamento' | 'servico' | 'limpeza' | 'checklist' | 'geral'

export type PopShift = 'manha' | 'tarde' | 'noite' | 'geral'

export interface PopDocument {
  id: string
  title: string
  sector: string
  version: string
  summary: string
  category: PopCategory
  shift: PopShift
  fileUrl: string
  fileName: string
  updatedAt: string
}

export const POP_CATEGORY_LABELS: Record<PopCategory, string> = {
  abertura: 'Abertura do setor',
  fechamento: 'Fechamento do setor',
  servico: 'Serviços do dia',
  limpeza: 'Limpeza',
  checklist: 'Checklist',
  geral: 'Geral',
}

export const POP_SHIFT_LABELS: Record<PopShift, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  geral: 'Geral',
}
