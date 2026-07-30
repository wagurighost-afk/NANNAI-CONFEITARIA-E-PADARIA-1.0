import bcrypt from 'bcryptjs'
import { findUserByEmail, findUserById } from './db.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt.js'
import {
  createRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
} from './seed.js'
import type { AppUser, AuthSession } from './types.js'

function mapUser(row: NonNullable<ReturnType<typeof findUserById>>): AppUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    name: row.name,
    ...(row.employee_id ? { employeeId: row.employee_id } : {}),
  }
}

function createSession(user: AppUser): AuthSession {
  const refreshJti = createRefreshToken(user.id)
  return {
    user,
    tokens: {
      accessToken: signAccessToken(user),
      refreshToken: signRefreshToken(user, refreshJti),
    },
  }
}

export function login(email: string, password: string): AuthSession {
  const row = findUserByEmail(email)
  if (!row) {
    throw new Error('E-mail ou senha incorretos.')
  }

  const valid = bcrypt.compareSync(password, row.password_hash)
  if (!valid) {
    throw new Error('E-mail ou senha incorretos.')
  }

  return createSession(mapUser(row))
}

export function getUserById(id: string): AppUser {
  const row = findUserById(id)
  if (!row) {
    throw new Error('Usuário não encontrado.')
  }
  return mapUser(row)
}

export function refreshSession(refreshToken: string): AuthSession {
  const payload = verifyRefreshToken(refreshToken)
  if (!isRefreshTokenValid(payload.jti, payload.sub)) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  const user = getUserById(payload.sub)
  revokeRefreshToken(payload.jti)
  return createSession(user)
}

export function logout(refreshToken?: string): void {
  if (!refreshToken) {
    return
  }

  try {
    const payload = verifyRefreshToken(refreshToken)
    revokeRefreshToken(payload.jti)
  } catch {
    // Ignore invalid refresh token on logout.
  }
}
