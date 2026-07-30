import jwt from 'jsonwebtoken'
import { config } from './config.js'
import type { AppUser } from './types.js'

interface AccessPayload {
  sub: string
  type: 'access'
}

interface RefreshPayload {
  sub: string
  type: 'refresh'
  jti: string
}

export function signAccessToken(user: AppUser): string {
  const payload: AccessPayload = { sub: user.id, type: 'access' }
  const options: jwt.SignOptions = { expiresIn: '8h' }
  return jwt.sign(payload, config.jwtSecret, options)
}

export function signRefreshToken(user: AppUser, jti: string): string {
  const payload: RefreshPayload = { sub: user.id, type: 'refresh', jti }
  const options: jwt.SignOptions = { expiresIn: `${config.refreshTokenTtlDays}d` }
  return jwt.sign(payload, config.jwtRefreshSecret, options)
}

export function verifyAccessToken(token: string): AccessPayload {
  const payload = jwt.verify(token, config.jwtSecret) as AccessPayload
  if (payload.type !== 'access') {
    throw new Error('Token inválido.')
  }
  return payload
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const payload = jwt.verify(token, config.jwtRefreshSecret) as RefreshPayload
  if (payload.type !== 'refresh') {
    throw new Error('Refresh token inválido.')
  }
  return payload
}
