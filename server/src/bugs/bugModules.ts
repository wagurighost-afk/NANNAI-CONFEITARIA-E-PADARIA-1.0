export const BUG_MODULE_OPTIONS = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'production', name: 'Produção' },
  { id: 'labels', name: 'Etiquetas' },
  { id: 'niimbot', name: 'NIIMBOT' },
  { id: 'bread-control', name: 'Controle de Pães' },
  { id: 'waste-control', name: 'Controle de Desperdício' },
  { id: 'comments', name: 'Comentários' },
  { id: 'schedule', name: 'Escala' },
  { id: 'cleaning-schedule', name: 'Escala de Limpeza' },
  { id: 'recipes', name: 'Receitas' },
  { id: 'pop', name: 'POP' },
  { id: 'intelligence', name: 'Dashboard Executivo' },
  { id: 'audit', name: 'Auditoria' },
  { id: 'employees', name: 'Colaboradores' },
  { id: 'ingredients', name: 'Ingredientes' },
  { id: 'auth', name: 'Login / Autenticação' },
  { id: 'outro', name: 'Outro' },
] as const

export function resolveBugModuleName(moduleId: string): string {
  return BUG_MODULE_OPTIONS.find((module) => module.id === moduleId)?.name ?? moduleId
}
