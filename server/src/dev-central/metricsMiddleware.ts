import type { NextFunction, Request, Response } from 'express'
import { recordErrorMetric, recordRequestMetric } from '../dev-central/metricsCollector.js'

export function devCentralMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now()

  res.on('finish', () => {
    if (!req.path.startsWith('/api')) {
      return
    }

    const durationMs = Date.now() - startedAt
    const at = new Date().toISOString()

    recordRequestMetric({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs,
      at,
    })

    if (res.statusCode >= 400) {
      recordErrorMetric({
        message: `HTTP ${res.statusCode} em ${req.method} ${req.path}`,
        path: req.path,
        status: res.statusCode,
        at,
      })
    }
  })

  next()
}
