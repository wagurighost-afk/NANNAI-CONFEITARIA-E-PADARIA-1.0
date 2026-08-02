import type { AuditAction, AuditEntityType } from '@/features/audit/types/audit.types'

export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  production: 'Produção',
  recipe: 'Receita',
  bread_control: 'Controle de Pães',
  waste_control: 'Controle de Desperdício',
  auth: 'Autenticação',
  monthly_schedule: 'Escala Mensal',
  intelligence: 'Inteligência Operacional',
  label: 'Etiqueta',
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Criação',
  update: 'Atualização',
  delete: 'Exclusão',
  status_change: 'Mudança de status',
  comment: 'Comentário',
  password_change: 'Alteração de senha',
  password_reset: 'Redefinição de senha',
  refresh: 'Atualização de dados',
  reprint: 'Reimpressão',
}

export const AUDIT_ENTITY_OPTIONS = Object.entries(AUDIT_ENTITY_LABELS).map(([value, label]) => ({
  value: value as AuditEntityType,
  label,
}))

export const AUDIT_ACTION_OPTIONS = Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({
  value: value as AuditAction,
  label,
}))
