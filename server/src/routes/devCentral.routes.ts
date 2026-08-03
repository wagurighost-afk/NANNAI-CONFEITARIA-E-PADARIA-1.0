import { Router } from 'express'
import { canAccessDevCentral } from '../dev-central/access.js'
import { getDevCentralDashboard } from '../dev-central/devCentral.service.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth } from '../middleware.js'

export const devCentralRouter = Router()

devCentralRouter.use(requireAuth)

function assertDevCentralAccess(
  req: AuthedRequest,
  res: { status: (code: number) => { json: (body: unknown) => void } },
): boolean {
  if (!req.user || !canAccessDevCentral(req.user)) {
    res.status(403).json({ message: 'Acesso restrito ao Administrador Master.' })
    return false
  }
  return true
}

devCentralRouter.get('/', async (req: AuthedRequest, res) => {
  if (!assertDevCentralAccess(req, res)) {
    return
  }

  try {
    res.json(await getDevCentralDashboard())
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar Central do Desenvolvedor.',
    })
  }
})

devCentralRouter.get('/health', (req: AuthedRequest, res) => {
  if (!assertDevCentralAccess(req, res)) {
    return
  }

  res.json({
    status: 'ok',
    module: 'dev-central',
    access: 'master-admin-only',
  })
})
