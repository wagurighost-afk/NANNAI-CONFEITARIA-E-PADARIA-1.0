export const APP_ROUTES = {
  root: '/',
  login: '/login',
  dashboard: '/',
  employees: '/colaboradores',
  ingredients: '/ingredientes',
  production: '/producao',
  breadControl: '/controle-paes',
  wasteControl: '/controle-desperdicio',
  schedule: '/escala',
  cleaningSchedule: '/escala-limpeza',
  recipes: '/receitas',
  comments: '/comentarios',
  pop: '/pop',
  changePassword: '/alterar-senha',
  intelligence: '/intelligence',
  audit: '/auditoria',
  notFound: '*',
} as const

export type AppRouteKey = keyof typeof APP_ROUTES
