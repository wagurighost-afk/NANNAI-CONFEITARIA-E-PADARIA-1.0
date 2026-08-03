import { Router } from 'express'
import { canAccessNannaiInsights } from '../nannai-insights/access.js'
import { getNannaiInsightsOverview } from '../nannai-insights/nannaiInsights.service.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth } from '../middleware.js'

export const nannaiInsightsRouter = Router()

nannaiInsightsRouter.use(requireAuth)

function assertAccess(req: AuthedRequest, res: { status: (code: number) => { json: (body: unknown) => void } }): boolean {
  if (!req.user || !canAccessNannaiInsights(req.user)) {
    res.status(403).json({ message: 'Acesso restrito ao NANNAI Insights.' })
    return false
  }
  return true
}

nannaiInsightsRouter.get('/', (req: AuthedRequest, res) => {
  if (!assertAccess(req, res)) {
    return
  }

  res.json(getNannaiInsightsOverview())
})

nannaiInsightsRouter.get('/health', (req: AuthedRequest, res) => {
  if (!assertAccess(req, res)) {
    return
  }

  res.json({
    status: 'ok',
    module: 'nannai-insights',
    phase: 'scaffold',
    version: '0.1.0-scaffold',
  })
})
