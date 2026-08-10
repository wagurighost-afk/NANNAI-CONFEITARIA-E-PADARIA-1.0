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
  findProductionByEmployeeAndDate,
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
import {
  importMasterPart1,
  importMasterPart2,
  importMasterPart3,
  importMasterPart4,
} from './products.service.js'
import { SEED_ADMIN, SEED_EMPLOYEES } from './data/employees.js'
import { listProductionTemplates } from './data/productionTemplate.js'
import {
  buildFreshProductionDay,
  buildSeedProductions,
  getNextProductionCode,
  getTodayIso,
} from './data/productionSeed.js'
import {
  isProductionDayUniqueConflict,
} from './db/productionDayConflict.js'
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
  const part3 = await importMasterPart3()
  console.log(
    `[seed] Cadastro Mestre Parte 3 — cadastrados: ${part3.created}, atualizados: ${part3.updated}, ignorados: ${part3.ignored}`,
  )
  const part4 = await importMasterPart4()
  console.log(
    `[seed] Cadastro Mestre Parte 4 — cadastrados: ${part4.created}, atualizados: ${part4.updated}, ignorados: ${part4.ignored}`,
  )
}

/**
 * Na virada operacional (America/Recife): materializa ProductionDay NOVOS.
 * Nunca reutiliza IDs fixos nem move o registro do dia anterior.
 */
export async function rolloverProductionsIfNeeded(): Promise<boolean> {
  const today = getTodayIso()
  const lastRollover = await getMeta(ROLLOVER_META_KEY)
  const materialized = await ensureProductionDaysForDate(today)

  if (lastRollover !== today) {
    await setMeta(ROLLOVER_META_KEY, today)
    return true
  }

  return materialized > 0
}

/**
 * Garante um ProductionDay por template válido na data operacional.
 * Idempotente sob concorrência (UNIQUE employeeId+date).
 * @returns quantidade de registros criados nesta chamada
 */
export async function ensureProductionDaysForDate(date: string): Promise<number> {
  const templates = listProductionTemplates()
  if (templates.length === 0) {
    return 0
  }

  const all = await loadAllProductions()
  const codes = all.map((item) => item.productionCode)
  let created = 0

  for (const template of templates) {
    const existing = await findProductionByEmployeeAndDate(template.employeeId, date)
    if (existing) {
      continue
    }

    const code = getNextProductionCode(codes)
    codes.push(code)
    const fresh = buildFreshProductionDay(template, date, code)

    try {
      await saveProduction(fresh)
      created += 1
    } catch (error) {
      if (!isProductionDayUniqueConflict(error)) {
        throw error
      }
      const recovered = await findProductionByEmployeeAndDate(template.employeeId, date)
      if (!recovered) {
        throw error
      }
    }
  }

  return created
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
