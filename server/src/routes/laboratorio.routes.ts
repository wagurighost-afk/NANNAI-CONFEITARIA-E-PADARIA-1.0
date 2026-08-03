import { Router } from 'express'
import { toAuditActor } from '../audit/actor.js'
import { safeAudit } from '../audit/safeAudit.js'
import { emitRealtime } from '../events.js'
import { canAccessLaboratorio } from '../laboratorio/access.js'
import {
  getLaboratorioDashboard,
  updateLaboratorioFeature,
  updateLaboratorioModule,
} from '../laboratorio/laboratorio.service.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth } from '../middleware.js'

export const laboratorioRouter = Router()

laboratorioRouter.use(requireAuth)

function assertLaboratorioAccess(req: AuthedRequest, res: { status: (code: number) => { json: (body: unknown) => void } }): boolean {
  if (!req.user || !canAccessLaboratorio(req.user)) {
    res.status(403).json({ message: 'Acesso restrito ao Administrador Master.' })
    return false
  }
  return true
}

laboratorioRouter.get('/', async (req: AuthedRequest, res) => {
  if (!assertLaboratorioAccess(req, res)) {
    return
  }

  try {
    res.json(await getLaboratorioDashboard())
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar Laboratório NANNAI.',
    })
  }
})

laboratorioRouter.get('/health', (req: AuthedRequest, res) => {
  if (!assertLaboratorioAccess(req, res)) {
    return
  }

  res.json({
    status: 'ok',
    module: 'laboratorio',
    version: '1.0.0',
    access: 'master-admin-only',
  })
})

laboratorioRouter.patch('/features/:id', async (req: AuthedRequest, res) => {
  if (!assertLaboratorioAccess(req, res)) {
    return
  }

  try {
    const actor = toAuditActor(req.user!)
    const dashboard = await updateLaboratorioFeature(
      req.params.id,
      {
        ...(req.body.category !== undefined ? { category: req.body.category } : {}),
        ...(req.body.lifecycle !== undefined ? { lifecycle: req.body.lifecycle } : {}),
        ...(req.body.enabled !== undefined ? { enabled: req.body.enabled } : {}),
      },
      { userId: actor.userId, userName: actor.userName },
    )

    await safeAudit(actor, {
      entityType: 'production',
      entityId: req.params.id,
      action: 'update',
      summary: `Laboratório: funcionalidade "${req.params.id}" atualizada`,
      after: req.body,
    })

    emitRealtime({ scope: 'laboratorio', action: 'feature_updated', scheduleId: req.params.id })
    res.json(dashboard)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao atualizar funcionalidade.'
    const status = message.includes('não encontrada') ? 404 : 400
    res.status(status).json({ message })
  }
})

laboratorioRouter.patch('/modules/:id', async (req: AuthedRequest, res) => {
  if (!assertLaboratorioAccess(req, res)) {
    return
  }

  try {
    const actor = toAuditActor(req.user!)
    const dashboard = await updateLaboratorioModule(
      req.params.id,
      { enabled: Boolean(req.body.enabled) },
      { userId: actor.userId, userName: actor.userName },
    )

    await safeAudit(actor, {
      entityType: 'production',
      entityId: req.params.id,
      action: 'update',
      summary: `Laboratório: módulo "${req.params.id}" ${req.body.enabled ? 'ativado' : 'desativado'}`,
      after: req.body,
    })

    emitRealtime({ scope: 'laboratorio', action: 'module_updated', scheduleId: req.params.id })
    res.json(dashboard)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao atualizar módulo.'
    const status = message.includes('não encontrado') ? 404 : 400
    res.status(status).json({ message })
  }
})
