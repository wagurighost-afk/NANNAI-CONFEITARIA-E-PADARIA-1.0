import type { LabelTemplateId } from '../types.js'

export interface LabelTemplateConfig {
  id: LabelTemplateId
  name: string
  description: string
  defaultShelfLifeDays: number
  accentColor: string
}

export const LABEL_TEMPLATES: readonly LabelTemplateConfig[] = [
  {
    id: 'producao',
    name: 'Produção',
    description: 'Produtos recém-finalizados na produção diária.',
    defaultShelfLifeDays: 3,
    accentColor: '#3e2723',
  },
  {
    id: 'buffet',
    name: 'Buffet',
    description: 'Itens expostos no buffet e área de serviço.',
    defaultShelfLifeDays: 1,
    accentColor: '#b8894a',
  },
  {
    id: 'camara-fria',
    name: 'Câmara fria',
    description: 'Produtos armazenados em refrigeração.',
    defaultShelfLifeDays: 7,
    accentColor: '#2f6b4f',
  },
  {
    id: 'congelados',
    name: 'Congelados',
    description: 'Produtos congelados e pré-preparados.',
    defaultShelfLifeDays: 90,
    accentColor: '#1e4d7a',
  },
  {
    id: 'ingredientes',
    name: 'Ingredientes',
    description: 'Matérias-primas abertas ou fracionadas.',
    defaultShelfLifeDays: 30,
    accentColor: '#6b5b4f',
  },
  {
    id: 'produtos-abertos',
    name: 'Produtos abertos',
    description: 'Embalagens abertas em uso na operação.',
    defaultShelfLifeDays: 3,
    accentColor: '#b42318',
  },
] as const

export function getLabelTemplate(id: LabelTemplateId): LabelTemplateConfig {
  const template = LABEL_TEMPLATES.find((item) => item.id === id)
  if (!template) {
    throw new Error('Modelo de etiqueta inválido.')
  }
  return template
}
