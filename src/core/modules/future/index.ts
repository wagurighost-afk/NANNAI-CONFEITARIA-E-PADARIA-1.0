/**
 * Stubs arquiteturais para módulos futuros.
 * Não implementar lógica de negócio aqui — apenas contratos preparados para API.
 */

export interface FutureModuleDescriptor {
  id: string
  label: string
  status: 'planned'
  description: string
}

export const FUTURE_MODULES: readonly FutureModuleDescriptor[] = [
  {
    id: 'inventory',
    label: 'Estoque',
    status: 'planned',
    description: 'Controle de entradas, saídas e saldos integrado a ingredientes.',
  },
  {
    id: 'purchases',
    label: 'Compras',
    status: 'planned',
    description: 'Pedidos de compra e fornecedores.',
  },
  {
    id: 'costs',
    label: 'Custos',
    status: 'planned',
    description: 'CMV e análise de custo por receita.',
  },
  {
    id: 'audit',
    label: 'Auditoria',
    status: 'planned',
    description: 'Trilha de alterações e conformidade.',
  },
  {
    id: 'ai',
    label: 'IA',
    status: 'planned',
    description: 'Assistente operacional e sugestões inteligentes.',
  },
] as const
