import type { NavItem } from '@/types/ui.types'
import type { Permission } from '@/types/rbac.types'
import { APP_ROUTES } from '@/core/constants/routes'

export interface AppNavItem extends Omit<NavItem, 'permission' | 'children'> {
  permission?: Permission
  children?: AppNavItem[]
}

export const MAIN_NAVIGATION: readonly AppNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: APP_ROUTES.dashboard,
    icon: 'LayoutDashboard',
    permission: 'dashboard:view',
  },
  {
    id: 'production',
    label: 'Produção',
    href: APP_ROUTES.production,
    icon: 'Factory',
    permission: 'production:view',
  },
  {
    id: 'production-conference',
    label: 'Conferência diária',
    href: APP_ROUTES.productionConference,
    icon: 'ClipboardCheck',
    permission: 'production:view',
  },
  {
    id: 'labels',
    label: 'Etiquetas',
    href: APP_ROUTES.labels,
    icon: 'Tags',
    permission: 'labels:view',
  },
  {
    id: 'niimbot',
    label: 'NIIMBOT',
    href: APP_ROUTES.niimbotSettings,
    icon: 'Bluetooth',
  },
  {
    id: 'bread-control',
    label: 'Controle de Pães',
    href: APP_ROUTES.breadControl,
    icon: 'ClipboardList',
    permission: 'bread-control:view',
  },
  {
    id: 'waste-control',
    label: 'Controle de Desperdício',
    href: APP_ROUTES.wasteControl,
    icon: 'Trash2',
    permission: 'waste-control:view',
  },
  {
    id: 'comments',
    label: 'Comentários',
    href: APP_ROUTES.comments,
    icon: 'MessageSquare',
    permission: 'production:view',
  },
  {
    id: 'schedule',
    label: 'Escala',
    href: APP_ROUTES.schedule,
    icon: 'CalendarDays',
    permission: 'schedule:view',
  },
  {
    id: 'cleaning-schedule',
    label: 'Escala de Limpeza',
    href: APP_ROUTES.cleaningSchedule,
    icon: 'Sparkles',
    permission: 'cleaning-schedule:view',
  },
  {
    id: 'recipes',
    label: 'Receitas',
    href: APP_ROUTES.recipes,
    icon: 'ChefHat',
    permission: 'recipes:view',
  },
  {
    id: 'pop',
    label: 'POP',
    href: APP_ROUTES.pop,
    icon: 'FileText',
    permission: 'pop:view',
  },
  {
    id: 'nannai-insights',
    label: 'NANNAI Insights',
    href: APP_ROUTES.nannaiInsights,
    icon: 'LineChart',
    permission: 'nannai-insights:view',
  },
  {
    id: 'executive-panel',
    label: 'Painel Executivo',
    href: APP_ROUTES.executivePanel,
    icon: 'Gauge',
    permission: 'executive-panel:view',
  },
  {
    id: 'intelligence',
    label: 'Dashboard Executivo',
    href: APP_ROUTES.intelligence,
    icon: 'BrainCircuit',
    permission: 'intelligence:view',
  },
  {
    id: 'audit',
    label: 'Auditoria',
    href: APP_ROUTES.audit,
    icon: 'History',
    permission: 'audit:view',
  },
  {
    id: 'laboratorio',
    label: 'Laboratório NANNAI',
    href: APP_ROUTES.laboratorio,
    icon: 'FlaskConical',
    permission: 'laboratorio:view',
  },
  {
    id: 'dev-central',
    label: 'Central do Desenvolvedor',
    href: APP_ROUTES.devCentral,
    icon: 'Terminal',
    permission: 'dev-central:view',
  },
  {
    id: 'advanced-settings',
    label: 'Configurações Avançadas',
    href: APP_ROUTES.advancedSettings,
    icon: 'Settings2',
    permission: 'settings:manage',
  },
  {
    id: 'bugs',
    label: 'Central de Bugs',
    href: APP_ROUTES.bugs,
    icon: 'Bug',
    permission: 'bugs:view',
  },
  {
    id: 'employees',
    label: 'Colaboradores',
    href: APP_ROUTES.employees,
    icon: 'Users',
    permission: 'employees:view',
  },
  {
    id: 'ingredients',
    label: 'Ingredientes',
    href: APP_ROUTES.ingredients,
    icon: 'Wheat',
    permission: 'ingredients:view',
  },
  {
    id: 'requisition',
    label: 'Requisição',
    href: APP_ROUTES.requisition,
    icon: 'Package',
    permission: 'ingredients:manage',
  },
  {
    id: 'products',
    label: 'Cadastro de Produtos',
    href: APP_ROUTES.products,
    icon: 'Package',
    permission: 'products:view',
  },
] as const
