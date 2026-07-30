import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from './jwt.js'
import { getUserById } from './auth.service.js'
import type { AppUser } from './types.js'

export interface AuthedRequest extends Request {
  user?: AppUser
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined
  const token = header?.startsWith('Bearer ') ? header.slice(7) : queryToken

  if (!token) {
    res.status(401).json({ message: 'Não autenticado.' })
    return
  }

  try {
    const payload = verifyAccessToken(token)
    req.user = getUserById(payload.sub)
    next()
  } catch {
    res.status(401).json({ message: 'Sessão inválida ou expirada.' })
  }
}

export function requireManager(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: 'Não autenticado.' })
    return
  }

  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    res.status(403).json({ message: 'Sem permissão para alterar receitas.' })
    return
  }

  next()
}
