/**
 * Rotas HTTP da Central de Inteligência Operacional.
 * Base: /api/intelligence
 * @module routes/intelligence
 */

import { Router } from 'express'
import { canAccessIntelligence } from '../intelligence/access.js'
import { normalizeLimit, normalizePeriod } from '../intelligence/constants.js'
import {
  getIntelligenceDashboard,
  getIntelligenceInsights,
  getIntelligenceInsightsReport,
  getOperationalKpis,
  getIntelligenceRecommendations,
  getIntelligenceRecommendationsReport,
  getIntelligenceTrends,
  getSmartInsightsReport,
  getSmartRecommendationsReport,
  refreshIntelligenceData,
} from '../intelligence/services/intelligence.service.js'
import type { IntelligenceMetricKey } from '../intelligence/types.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth } from '../middleware.js'

export const intelligenceRouter = Router()

intelligenceRouter.use(requireAuth)

function parsePeriod(req: AuthedRequest) {
  const year = Number(req.query.year)
  const month = Number(req.query.month)
  return normalizePeriod(year, month)
}

function assertIntelligenceAccess(req: AuthedRequest, res: { status: (code: number) => { json: (body: unknown) => void } }): boolean {
  if (!req.user || !canAccessIntelligence(req.user)) {
    res.status(403).json({ message: 'Sem permissão para acessar a Central de Inteligência Operacional.' })
    return false
  }
  return true
}

intelligenceRouter.get('/health', (req: AuthedRequest, res) => {
  if (!assertIntelligenceAccess(req, res)) {
    return
  }

  res.json({
    status: 'ok',
    module: 'intelligence',
    version: '1.0.0',
    capabilities: ['kpis', 'operational-kpis', 'smart-insights', 'insights', 'smart-recommendations', 'recommendations', 'trends', 'dashboard', 'refresh'],
  })
})

intelligenceRouter.get('/dashboard', async (req: AuthedRequest, res) => {
  if (!assertIntelligenceAccess(req, res)) {
    return
  }

  try {
    const period = parsePeriod(req)
    const limit = normalizeLimit(Number(req.query.limit))
    res.json(await getIntelligenceDashboard(period, limit))
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar dashboard de inteligência.',
    })
  }
})

intelligenceRouter.get('/kpis', async (req: AuthedRequest, res) => {
  if (!assertIntelligenceAccess(req, res)) {
    return
  }

  try {
    const period = parsePeriod(req)
    res.json(await getOperationalKpis(period))
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar KPIs.',
    })
  }
})

intelligenceRouter.get('/kpis/operational', async (req: AuthedRequest, res) => {
  if (!assertIntelligenceAccess(req, res)) {
    return
  }

  try {
    const period = parsePeriod(req)
    res.json(await getOperationalKpis(period))
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar KPIs operacionais.',
    })
  }
})

intelligenceRouter.get('/kpis/production', async (req: AuthedRequest, res) => {
  if (!assertIntelligenceAccess(req, res)) {
    return
  }

  try {
    const period = parsePeriod(req)
    const report = await getOperationalKpis(period)
    res.json(report.production)
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar KPIs de produção.',
    })
  }
})

intelligenceRouter.get('/kpis/waste', async (req: AuthedRequest, res) => {
  if (!assertIntelligenceAccess(req, res)) {
    return
  }

  try {
    const period = parsePeriod(req)
    const report = await getOperationalKpis(period)
    res.json(report.waste)
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar KPIs de desperdício.',
    })
  }
})

intelligenceRouter.get('/kpis/bread', async (req: AuthedRequest, res) => {
  if (!assertIntelligenceAccess(req, res)) {
    return
  }

  try {
    const period = parsePeriod(req)
    const report = await getOperationalKpis(period)
    res.json(report.bread)
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar KPIs de pães.',
    })
  }
})

intelligenceRouter.get('/kpis/recipes', async (req: AuthedRequest, res) => {
  if (!assertIntelligenceAccess(req, res)) {
    return
  }

  try {
    const period = parsePeriod(req)
    const report = await getOperationalKpis(period)
    res.json(report.recipes)
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar KPIs de receitas.',
    })
  }
})

intelligenceRouter.get('/kpis/employees', async (req: AuthedRequest, res) => {
  if (!assertIntelligenceAccess(req, res)) {
    return
  }

  try {
    const period = parsePeriod(req)
    const report = await getOperationalKpis(period)
    res.json(report.employees)
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar KPIs de colaboradores.',
    })
  }
})

intelligenceRouter.get('/insights', async (req: AuthedRequest, res) => {
  if (!assertIntelligenceAccess(req, res)) {
    return
  }

  try {
    const period = parsePeriod(req)
    const limit = req.query.limit !== undefined ? normalizeLimit(Number(req.query.limit)) : undefined
    if (limit !== undefined) {
      res.json(await getIntelligenceInsights(period, limit))
      return
    }
    res.json(await getIntelligenceInsightsReport(period))
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar insights inteligentes.',
    })
  }
})

intelligenceRouter.get('/insights/smart', async (req: AuthedRequest, res) => {
  if (!assertIntelligenceAccess(req, res)) {
    return
  }

  try {
    const period = parsePeriod(req)
    res.json(await getSmartInsightsReport(period))
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar insights inteligentes.',
    })
  }
})

intelligenceRouter.get('/recommendations', async (req: AuthedRequest, res) => {
  if (!assertIntelligenceAccess(req, res)) {
    return
  }

  try {
    const period = parsePeriod(req)
    const limit = req.query.limit !== undefined ? normalizeLimit(Number(req.query.limit)) : undefined
    if (limit !== undefined) {
      res.json(await getIntelligenceRecommendations(period, limit))
      return
    }
    res.json(await getIntelligenceRecommendationsReport(period))
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar recomendações.',
    })
  }
})

intelligenceRouter.get('/recommendations/smart', async (req: AuthedRequest, res) => {
  if (!assertIntelligenceAccess(req, res)) {
    return
  }

  try {
    const period = parsePeriod(req)
    res.json(await getSmartRecommendationsReport(period))
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar recomendações inteligentes.',
    })
  }
})

intelligenceRouter.get('/trends', async (req: AuthedRequest, res) => {
  if (!assertIntelligenceAccess(req, res)) {
    return
  }

  try {
    const period = parsePeriod(req)
    const limit = normalizeLimit(Number(req.query.limit))
    const metricKey = typeof req.query.metricKey === 'string'
      ? (req.query.metricKey as IntelligenceMetricKey)
      : undefined
    res.json(await getIntelligenceTrends(period, metricKey, limit))
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar tendências.',
    })
  }
})

intelligenceRouter.post('/refresh', async (req: AuthedRequest, res) => {
  if (!assertIntelligenceAccess(req, res)) {
    return
  }

  try {
    const year = Number(req.body?.year ?? req.query.year)
    const month = Number(req.body?.month ?? req.query.month)
    const period = normalizePeriod(year, month)
    const limit = normalizeLimit(Number(req.body?.limit ?? req.query.limit))
    const result = await refreshIntelligenceData(period, limit)

    const { emitRealtime } = await import('../events.js')
    emitRealtime({ scope: 'intelligence', action: 'refreshed', scheduleId: `intel-${period.year}-${period.month}` })

    res.json(result)
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao atualizar inteligência operacional.',
    })
  }
})
