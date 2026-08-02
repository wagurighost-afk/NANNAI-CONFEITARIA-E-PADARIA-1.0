/**
 * Rotas de consulta do histórico de auditoria.
 * Base: /api/audit
 */

import { Router } from 'express'
import { canViewAuditLogs } from '../audit/access.js'
import { getAuditLogs } from '../audit/audit.service.js'
import type { AuditAction, AuditEntityType } from '../audit/types.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth } from '../middleware.js'

export const auditRouter = Router()

auditRouter.use(requireAuth)

const ENTITY_TYPES = new Set<AuditEntityType>([
  'production',
  'recipe',
  'bread_control',
  'waste_control',
  'auth',
  'monthly_schedule',
  'intelligence',
])

const ACTIONS = new Set<AuditAction>([
  'create',
  'update',
  'delete',
  'status_change',
  'comment',
  'password_change',
  'password_reset',
  'refresh',
])

auditRouter.get('/logs', async (req: AuthedRequest, res) => {
  if (!req.user || !canViewAuditLogs(req.user)) {
    res.status(403).json({ message: 'Sem permissão para visualizar o histórico de auditoria.' })
    return
  }

  try {
    const entityType = typeof req.query.entityType === 'string' ? req.query.entityType : undefined
    const action = typeof req.query.action === 'string' ? req.query.action : undefined

    if (entityType && !ENTITY_TYPES.has(entityType as AuditEntityType)) {
      res.status(400).json({ message: 'Tipo de entidade inválido.' })
      return
    }

    if (action && !ACTIONS.has(action as AuditAction)) {
      res.status(400).json({ message: 'Ação inválida.' })
      return
    }

    const result = await getAuditLogs({
      entityType: entityType as AuditEntityType | undefined,
      entityId: typeof req.query.entityId === 'string' ? req.query.entityId : undefined,
      actorId: typeof req.query.actorId === 'string' ? req.query.actorId : undefined,
      action: action as AuditAction | undefined,
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
      limit: req.query.limit !== undefined ? Number(req.query.limit) : undefined,
      offset: req.query.offset !== undefined ? Number(req.query.offset) : undefined,
    })

    res.json(result)
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar histórico de auditoria.',
    })
  }
})
