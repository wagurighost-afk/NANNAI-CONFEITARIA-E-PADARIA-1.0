import bcrypt from 'bcryptjs'
import { findUserByEmail, findUserById } from './db/index.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt.js'
import {
  createRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
} from './seed.js'
import type { AppUser, AuthSession } from './types.js'
import type { UserRow } from './db/index.js'

function mapUser(row: UserRow): AppUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    name: row.name,
    ...(row.employee_id ? { employeeId: row.employee_id } : {}),
  }
}

async function createSession(user: AppUser): Promise<AuthSession> {
  const refreshJti = await createRefreshToken(user.id)
  return {
    user,
    tokens: {
      accessToken: signAccessToken(user),
      refreshToken: signRefreshToken(user, refreshJti),
    },
  }
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const row = await findUserByEmail(email)
  if (!row) {
    throw new Error('E-mail ou senha incorretos.')
  }

  const valid = bcrypt.compareSync(password, row.password_hash)
  if (!valid) {
    throw new Error('E-mail ou senha incorretos.')
  }

  return createSession(mapUser(row))
}

export async function getUserById(id: string): Promise<AppUser> {
  const row = await findUserById(id)
  if (!row) {
    throw new Error('Usuário não encontrado.')
  }
  return mapUser(row)
}

export async function refreshSession(refreshToken: string): Promise<AuthSession> {
  const payload = verifyRefreshToken(refreshToken)
  if (!(await isRefreshTokenValid(payload.jti, payload.sub))) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  const user = await getUserById(payload.sub)
  await revokeRefreshToken(payload.jti)
  return createSession(user)
}

export async function logout(refreshToken?: string): Promise<void> {
  if (!refreshToken) {
    return
  }

  try {
    const payload = verifyRefreshToken(refreshToken)
    await revokeRefreshToken(payload.jti)
  } catch {
    // Ignore invalid refresh token on logout.
  }
}
