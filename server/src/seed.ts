import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { config } from './config.js'
import {
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
  saveProductionRecord,
  saveRecipeRecord,
  setMeta,
} from './db.js'
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

export function seedDatabase(): void {
  if (countUsers() === 0) {
    const passwordHash = bcrypt.hashSync(config.defaultPassword, 12)

    insertUser({
      id: SEED_ADMIN.id,
      email: SEED_ADMIN.email.toLowerCase(),
      password_hash: passwordHash,
      role: SEED_ADMIN.role,
      employee_id: 'emp-david',
      name: SEED_ADMIN.name,
    })

    for (const employee of SEED_EMPLOYEES) {
      insertUser({
        id: `usr-${employee.id}`,
        email: employee.email.toLowerCase(),
        password_hash: passwordHash,
        role: employee.role,
        employee_id: employee.id,
        name: employee.name,
      })
    }
  }

  if (countProductions() === 0) {
    for (const production of buildSeedProductions()) {
      saveProduction(production)
    }
    setMeta(ROLLOVER_META_KEY, getTodayIso())
  } else {
    rolloverProductionsIfNeeded()
  }

  if (countRecipes() === 0) {
    for (const recipe of RECIPES_SEED) {
      saveRecipeRecord(recipe)
    }
  }
}

export function rolloverProductionsIfNeeded(): boolean {
  const today = getTodayIso()
  const lastRollover = getMeta(ROLLOVER_META_KEY)

  if (lastRollover === today) {
    return false
  }

  const all = loadAllProductions()
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
    saveProduction(refreshed)
    changed = true
  }

  setMeta(ROLLOVER_META_KEY, today)
  return changed
}

export function saveProduction(production: ProductionDay): ProductionDay {
  saveProductionRecord(production)
  return production
}

export function loadProductionById(id: string): ProductionDay | null {
  return loadProductionRecord(id)
}

export function loadAllProductions(): ProductionDay[] {
  return loadAllProductionRecords()
}

export function deleteProduction(id: string): void {
  deleteProductionRecord(id)
}

export function createRefreshToken(userId: string): string {
  const token = randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 14)
  insertRefreshToken(token, userId, expiresAt.toISOString())
  return token
}

export function revokeRefreshToken(token: string): void {
  deleteRefreshToken(token)
}

export function isRefreshTokenValid(token: string, userId: string): boolean {
  const row = findRefreshToken(token, userId)
  if (!row) {
    return false
  }
  return new Date(row.expires_at).getTime() > Date.now()
}
