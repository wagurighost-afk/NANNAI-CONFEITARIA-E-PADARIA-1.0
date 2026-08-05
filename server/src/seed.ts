import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { config } from './config.js'
import {
  countMonthlySchedules,
  countProductions,
  countRecipes,
  countUsers,
  deleteProductionRecord,
  deleteRefreshToken,
  findRefreshToken,
  getMeta,
  insertRefreshToken,
  findUserByEmail,
  findUserByEmployeeId,
  findUserById,
  insertUser,
  loadAllProductionRecords,
  loadProductionRecord,
  saveMonthlyScheduleRecord,
  saveProductionRecord,
  saveRecipeRecord,
  setMeta,
  updateUserEmployeeId,
  updateUserIdentity,
  updateUserPassword,
  updateUserRole,
} from './db/index.js'
import { MONTHLY_SCHEDULE_SEED } from './data/monthlyScheduleSeed.js'
import { RECIPES_SEED } from './data/recipesSeed.js'
import { importMasterPart1, importMasterPart2 } from './products.service.js'
import { SEED_ADMIN, SEED_EMPLOYEES } from './data/employees.js'
import {
  ACTIVE_PRODUCTION_IDS,
  SKIPPED_PRODUCTION_EMPLOYEE_IDS,
} from './data/activeProduction.js'
import { PRODUCTION_DIVISION } from './data/productionDivision.js'
import { buildDailyProduction, buildSeedProductions, getTodayIso } from './data/productionSeed.js'
import type { UserRow } from './db/types.js'
import type { ProductionDay } from './types.js'

const ROLLOVER_META_KEY = 'production_rollover_date'

export async function seedDatabase(): Promise<void> {
  if ((await countUsers()) === 0) {
    const passwordHash = bcrypt.hashSync(config.defaultPassword, 12)

    await insertUser({
      id: SEED_ADMIN.id,
      email: SEED_ADMIN.email.toLowerCase(),
      password_hash: passwordHash,
      password_plain: config.defaultPassword,
      role: SEED_ADMIN.role,
      employee_id: null,
      name: SEED_ADMIN.name,
    })

    for (const employee of SEED_EMPLOYEES) {
      await insertUser({
        id: `usr-${employee.id}`,
        email: employee.email.toLowerCase(),
        password_hash: passwordHash,
        password_plain: config.defaultPassword,
        role: employee.role,
        employee_id: employee.id,
        name: employee.name,
      })
    }
  } else {
    // Keep login identities aligned with seed corrections (name/email).
    await syncSeedEmployeeIdentities()
  }

  if ((await countProductions()) === 0) {
    for (const production of buildSeedProductions()) {
      await saveProduction(production)
    }
    await setMeta(ROLLOVER_META_KEY, getTodayIso())
  } else {
    await rolloverProductionsIfNeeded()
  }

  if ((await countRecipes()) === 0) {
    for (const recipe of RECIPES_SEED) {
      await saveRecipeRecord(recipe)
    }
  }

  if ((await countMonthlySchedules()) === 0) {
    for (const schedule of MONTHLY_SCHEDULE_SEED) {
      await saveMonthlyScheduleRecord(schedule)
    }
  }

  // Upsert do Cadastro Mestre: cria novos e atualiza só o custo.
  const part1 = await importMasterPart1()
  console.log(
    `[seed] Cadastro Mestre Parte 1 — cadastrados: ${part1.created}, atualizados: ${part1.updated}, ignorados: ${part1.ignored}`,
  )
  const part2 = await importMasterPart2()
  console.log(
    `[seed] Cadastro Mestre Parte 2 — cadastrados: ${part2.created}, atualizados: ${part2.updated}, ignorados: ${part2.ignored}`,
  )
}

export async function rolloverProductionsIfNeeded(): Promise<boolean> {
  const today = getTodayIso()
  const lastRollover = await getMeta(ROLLOVER_META_KEY)

  if (lastRollover === today) {
    return false
  }

  const all = await loadAllProductions()
  const byId = new Map(all.map((production) => [production.id, production]))
  let changed = false

  for (const entry of PRODUCTION_DIVISION) {
    if (SKIPPED_PRODUCTION_EMPLOYEE_IDS.has(entry.employeeId)) {
      continue
    }

    const meta = ACTIVE_PRODUCTION_IDS[entry.employeeId]
    if (!meta) {
      continue
    }

    const existing = byId.get(meta.id)
    const refreshed = buildDailyProduction(entry, meta.id, meta.code, today, existing)
    await saveProduction(refreshed)
    changed = true
  }

  await setMeta(ROLLOVER_META_KEY, today)
  return changed
}

export async function saveProduction(production: ProductionDay): Promise<ProductionDay> {
  await saveProductionRecord(production)
  return production
}

async function syncSeedEmployeeIdentities(): Promise<void> {
  await restoreSeedAdminIdentity()

  for (const employee of SEED_EMPLOYEES) {
    const row = await resolveSeedEmployeeUser(employee.id)
    if (!row) {
      continue
    }

    const nextEmail = employee.email.toLowerCase()
    const targetEmail = await resolveSeedEmail(row, nextEmail)
    const identityChanged = row.name !== employee.name || row.email.toLowerCase() !== targetEmail
    const roleChanged = row.role !== employee.role

    if (identityChanged) {
      await updateUserIdentity(row.id, {
        name: employee.name,
        email: targetEmail,
      })
    }

    if (roleChanged) {
      await updateUserRole(row.id, employee.role)
    }
  }
}

/**
 * Garante a conta técnica do admin (usr_nannai_001).
 * Em deploys antigos ela chegou a herdar nome/e-mail do Chef (David/Devid),
 * bloqueando o login correto da liderança.
 */
async function restoreSeedAdminIdentity(): Promise<void> {
  const admin = await findUserById(SEED_ADMIN.id)
  if (!admin) {
    return
  }

  if (admin.employee_id) {
    await updateUserEmployeeId(SEED_ADMIN.id, null)
  }

  const targetEmail = SEED_ADMIN.email.toLowerCase()
  const emailOwner = await findUserByEmail(targetEmail)
  if (emailOwner && emailOwner.id !== admin.id) {
    console.warn(
      `[seed] E-mail canônico do admin (${targetEmail}) pertence a ${emailOwner.id}; mantendo ${admin.email}.`,
    )
  } else if (admin.name !== SEED_ADMIN.name || admin.email.toLowerCase() !== targetEmail) {
    await updateUserIdentity(SEED_ADMIN.id, {
      name: SEED_ADMIN.name,
      email: targetEmail,
    })
  }

  if (admin.role !== SEED_ADMIN.role) {
    await updateUserRole(SEED_ADMIN.id, SEED_ADMIN.role)
  }

  // Conta técnica: garante senha padrão após recuperações de identidade.
  if (!bcrypt.compareSync(config.defaultPassword, admin.password_hash)) {
    await updateUserPassword(
      SEED_ADMIN.id,
      bcrypt.hashSync(config.defaultPassword, 12),
      config.defaultPassword,
    )
  }
}

async function resolveSeedEmployeeUser(employeeId: string): Promise<UserRow | undefined> {
  const canonical = await findUserById(`usr-${employeeId}`)
  if (canonical) {
    return canonical
  }

  const linked = await findUserByEmployeeId(employeeId)
  if (linked && linked.id !== SEED_ADMIN.id) {
    return linked
  }

  return undefined
}

async function resolveSeedEmail(row: UserRow, nextEmail: string): Promise<string> {
  if (row.email.toLowerCase() === nextEmail) {
    return nextEmail
  }

  const owner = await findUserByEmail(nextEmail)
  if (!owner || owner.id === row.id) {
    return nextEmail
  }

  console.warn(
    `[seed] E-mail ${nextEmail} já pertence a ${owner.id}; mantendo ${row.email} em ${row.id}.`,
  )
  return row.email.toLowerCase()
}

export async function loadProductionById(id: string): Promise<ProductionDay | null> {
  return loadProductionRecord(id)
}

export async function loadAllProductions(): Promise<ProductionDay[]> {
  return loadAllProductionRecords()
}

export async function deleteProduction(id: string): Promise<void> {
  await deleteProductionRecord(id)
}

export async function createRefreshToken(userId: string): Promise<string> {
  const token = randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 14)
  await insertRefreshToken(token, userId, expiresAt.toISOString())
  return token
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await deleteRefreshToken(token)
}

export async function isRefreshTokenValid(token: string, userId: string): Promise<boolean> {
  const row = await findRefreshToken(token, userId)
  if (!row) {
    return false
  }
  return new Date(row.expires_at).getTime() > Date.now()
}
