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
  insertUser,
  loadAllProductionRecords,
  loadProductionRecord,
  saveMonthlyScheduleRecord,
  saveProductionRecord,
  saveRecipeRecord,
  setMeta,
} from './db/index.js'
import { MONTHLY_SCHEDULE_SEED } from './data/monthlyScheduleSeed.js'
import { RECIPES_SEED } from './data/recipesSeed.js'
import { SEED_ADMIN, SEED_EMPLOYEES } from './data/employees.js'
import {
  ACTIVE_PRODUCTION_IDS,
  SKIPPED_PRODUCTION_EMPLOYEE_IDS,
} from './data/activeProduction.js'
import { PRODUCTION_DIVISION } from './data/productionDivision.js'
import { buildDailyProduction, buildSeedProductions, getTodayIso } from './data/productionSeed.js'
import type { ProductionDay } from './types.js'

const ROLLOVER_META_KEY = 'production_rollover_date'

export async function seedDatabase(): Promise<void> {
  if ((await countUsers()) === 0) {
    const passwordHash = bcrypt.hashSync(config.defaultPassword, 12)

    await insertUser({
      id: SEED_ADMIN.id,
      email: SEED_ADMIN.email.toLowerCase(),
      password_hash: passwordHash,
      role: SEED_ADMIN.role,
      employee_id: 'emp-david',
      name: SEED_ADMIN.name,
    })

    for (const employee of SEED_EMPLOYEES) {
      await insertUser({
        id: `usr-${employee.id}`,
        email: employee.email.toLowerCase(),
        password_hash: passwordHash,
        role: employee.role,
        employee_id: employee.id,
        name: employee.name,
      })
    }
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
