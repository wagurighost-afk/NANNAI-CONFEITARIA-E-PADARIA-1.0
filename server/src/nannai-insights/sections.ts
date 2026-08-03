import type { NannaiInsightsSection } from './types.js'

function placeholder(sectionId: string, index: number, title: string, description: string) {
  return {
    id: `${sectionId}-slot-${index}`,
    title,
    description,
    status: 'planned' as const,
  }
}

export const NANNAI_INSIGHTS_SECTIONS: readonly NannaiInsightsSection[] = [
  {
    id: 'producao',
    title: 'Produção',
    description: 'Análises de volume, eficiência e aderência da produção diária.',
    status: 'planned',
    placeholders: [
      placeholder('producao', 1, 'Painel de produção', 'Espaço reservado para KPIs e tendências de produção.'),
      placeholder('producao', 2, 'Comparativos por turno', 'Espaço reservado para análises por turno e setor.'),
    ],
  },
  {
    id: 'desperdicio',
    title: 'Desperdício',
    description: 'Indicadores de perdas, metas e evolução do controle de desperdício.',
    status: 'planned',
    placeholders: [
      placeholder('desperdicio', 1, 'Painel de desperdício', 'Espaço reservado para métricas de desperdício.'),
      placeholder('desperdicio', 2, 'Alertas de meta', 'Espaço reservado para alertas inteligentes de meta.'),
    ],
  },
  {
    id: 'estoque',
    title: 'Estoque',
    description: 'Visão de saldos, giro e rupturas de ingredientes e insumos.',
    status: 'planned',
    placeholders: [
      placeholder('estoque', 1, 'Painel de estoque', 'Espaço reservado para análises de estoque.'),
    ],
  },
  {
    id: 'custos',
    title: 'Custos',
    description: 'CMV, margens e impacto financeiro da operação.',
    status: 'planned',
    placeholders: [
      placeholder('custos', 1, 'Painel de custos', 'Espaço reservado para análises de CMV e custos.'),
      placeholder('custos', 2, 'Simulações', 'Espaço reservado para projeções financeiras.'),
    ],
  },
  {
    id: 'receitas',
    title: 'Receitas',
    description: 'Performance de fichas técnicas, rendimento e padronização.',
    status: 'planned',
    placeholders: [
      placeholder('receitas', 1, 'Painel de receitas', 'Espaço reservado para análises de receitas.'),
    ],
  },
  {
    id: 'equipe',
    title: 'Equipe',
    description: 'Produtividade, escalas e desempenho dos colaboradores.',
    status: 'planned',
    placeholders: [
      placeholder('equipe', 1, 'Painel de equipe', 'Espaço reservado para análises de equipe.'),
    ],
  },
  {
    id: 'etiquetas',
    title: 'Etiquetas',
    description: 'Volume de impressão, conformidade e padrões de etiquetagem.',
    status: 'planned',
    placeholders: [
      placeholder('etiquetas', 1, 'Painel de etiquetas', 'Espaço reservado para análises de etiquetas.'),
    ],
  },
  {
    id: 'planejamento',
    title: 'Planejamento',
    description: 'Previsões, demanda e apoio à decisão operacional.',
    status: 'planned',
    placeholders: [
      placeholder('planejamento', 1, 'Painel de planejamento', 'Espaço reservado para análises preditivas.'),
      placeholder('planejamento', 2, 'Cenários', 'Espaço reservado para simulações de cenários.'),
    ],
  },
]
