/**
 * Respostas de erro seguras para rotas da Central de Inteligência.
 * @module intelligence/utils/httpErrors
 */

import type { Response } from 'express'

const isProduction = process.env.NODE_ENV === 'production'

export function respondIntelligenceError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
): void {
  console.error('[intelligence]', error)
  const message =
    !isProduction && error instanceof Error && error.message
      ? error.message
      : fallbackMessage
  res.status(500).json({ message })
}
