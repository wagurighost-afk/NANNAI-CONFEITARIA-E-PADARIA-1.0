import bcrypt from 'bcryptjs'
import { safeAudit } from './audit/safeAudit.js'
import { toAuditActor } from './audit/actor.js'
import { canManageUserPasswords } from './auth/passwordAccess.js'
import { config } from './config.js'
import {
  deleteRefreshTokensForUser,
  findUserByEmail,
  findUserByEmployeeId,
  findUserById,
  updateUserPassword,
} from './db/index.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt.js'
import {
  createRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
} from './seed.js'
import type { AppUser, AuthSession } from './types.js'
import { getSystemBadgesForRole } from './auth/roles.js'
import type { UserRow } from './db/index.js'

function mapUser(row: UserRow): AppUser {
  const badges = getSystemBadgesForRole(row.role)
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    name: row.name,
    ...(row.employee_id ? { employeeId: row.employee_id } : {}),
    ...(badges.length > 0 ? { badges } : {}),
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

const PASSWORD_MIN_LENGTH = 6

function assertValidPassword(password: string): void {
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  }
}

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12)
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  actor?: AppUser,
): Promise<void> {
  assertValidPassword(newPassword)

  const row = await findUserById(userId)
  if (!row) {
    throw new Error('Usuário não encontrado.')
  }

  const valid = bcrypt.compareSync(currentPassword, row.password_hash)
  if (!valid) {
    throw new Error('Senha atual incorreta.')
  }

  if (bcrypt.compareSync(newPassword, row.password_hash)) {
    throw new Error('A nova senha deve ser diferente da senha atual.')
  }

  await updateUserPassword(userId, hashPassword(newPassword), newPassword)
  await deleteRefreshTokensForUser(userId)

  const auditActor = actor ? toAuditActor(actor) : toAuditActor(mapUser(row))
  await safeAudit(auditActor, {
    entityType: 'auth',
    entityId: userId,
    action: 'password_change',
    summary: `Senha alterada por ${auditActor.userName}`,
    before: { userId, email: row.email },
    after: { userId, email: row.email, passwordChanged: true },
  })
}

export async function getEmployeePassword(
  actor: AppUser,
  employeeId: string,
): Promise<{ password: string | null; email: string; name: string }> {
  if (!canManageUserPasswords(actor)) {
    throw new Error('Sem permissão para visualizar senhas.')
  }

  const row = await findUserByEmployeeId(employeeId)
  if (!row) {
    throw new Error('Usuário de acesso não encontrado para este colaborador.')
  }

  return {
    email: row.email,
    name: row.name,
    password: row.password_plain,
  }
}

export async function resetEmployeePassword(
  actor: AppUser,
  employeeId: string,
  newPassword?: string,
): Promise<{ password: string; email: string; name: string }> {
  if (!canManageUserPasswords(actor)) {
    throw new Error('Sem permissão para redefinir senhas.')
  }

  const row = await findUserByEmployeeId(employeeId)
  if (!row) {
    throw new Error('Usuário de acesso não encontrado para este colaborador.')
  }

  const password = (newPassword?.trim() || config.defaultPassword).trim()
  assertValidPassword(password)

  await updateUserPassword(row.id, hashPassword(password), password)
  await deleteRefreshTokensForUser(row.id)

  await safeAudit(toAuditActor(actor), {
    entityType: 'auth',
    entityId: row.id,
    action: 'password_reset',
    summary: `Senha redefinida para ${row.name} por ${actor.name}`,
    before: { userId: row.id, email: row.email, employeeId },
    after: { userId: row.id, email: row.email, employeeId, passwordReset: true },
  })

  return {
    email: row.email,
    name: row.name,
    password,
  }
}
