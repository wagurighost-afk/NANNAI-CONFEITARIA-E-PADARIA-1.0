export const APP_ROUTES = {
  root: '/',
  login: '/login',
  dashboard: '/',
  employees: '/colaboradores',
  ingredients: '/ingredientes',
  production: '/producao',
  breadControl: '/controle-paes',
  schedule: '/escala',
  cleaningSchedule: '/escala-limpeza',
  recipes: '/receitas',
  comments: '/comentarios',
  pop: '/pop',
  notFound: '*',
} as const

export type AppRouteKey = keyof typeof APP_ROUTES
