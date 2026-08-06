import { Router } from 'express'
import { canAccessExecutivePanel } from '../executive-panel/access.js'
import { getExecutivePanelReport } from '../executive-panel/executivePanel.service.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth } from '../middleware.js'

export const executivePanelRouter = Router()

executivePanelRouter.use(requireAuth)

function assertAccess(req: AuthedRequest, res: { status: (code: number) => { json: (body: unknown) => void } }): boolean {
  if (!req.user || !canAccessExecutivePanel(req.user)) {
    res.status(403).json({ message: 'Sem permissão para acessar o Painel Executivo.' })
    return false
  }
  return true
}

executivePanelRouter.get('/health', (req: AuthedRequest, res) => {
  if (!assertAccess(req, res)) {
    return
  }

  res.json({
    status: 'ok',
    module: 'executive-panel',
    version: '1.0.0',
    capabilities: ['dashboard', 'period-filters', 'realtime-cache'],
  })
})

executivePanelRouter.get('/dashboard', async (req: AuthedRequest, res) => {
  if (!assertAccess(req, res)) {
    return
  }

  try {
    const preset = typeof req.query.preset === 'string' ? req.query.preset : undefined
    const from = typeof req.query.from === 'string' ? req.query.from : undefined
    const to = typeof req.query.to === 'string' ? req.query.to : undefined
    res.json(await getExecutivePanelReport({ preset, from, to }))
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar o Painel Executivo.',
    })
  }
})
