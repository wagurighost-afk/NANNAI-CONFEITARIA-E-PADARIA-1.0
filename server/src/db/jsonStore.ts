import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'
import type { DatabaseFile, DatabaseStore, RefreshTokenRow, UserRow } from './types.js'
import type {
  BreadControlDay,
  CatalogProduct,
  MonthlySchedule,
  ProductionDay,
  Recipe,
  WasteControlDay,
} from '../types.js'
import type { PaginatedRecipes, RecipeListQuery, RecipeStats } from '../types.js'
import { computeRecipeStats, listRecipesFromMemory } from '../recipes/recipeQuery.js'

const dbPath = path.join(config.dataDir, 'nannai.json')

function emptyDb(): DatabaseFile {
  return {
    users: [],
    productions: [],
    recipes: [],
    products: [],
    monthly_schedules: [],
    bread_control_days: [],
    waste_control_days: [],
    label_records: [],
    intelligence_snapshots: [],
    audit_logs: [],
    refresh_tokens: [],
    meta: {},
  }
}

function normalizeDb(parsed: Partial<DatabaseFile>): DatabaseFile {
  return {
    users: parsed.users ?? [],
    productions: parsed.productions ?? [],
    recipes: parsed.recipes ?? [],
    products: parsed.products ?? [],
    monthly_schedules: parsed.monthly_schedules ?? [],
    bread_control_days: parsed.bread_control_days ?? [],
    waste_control_days: parsed.waste_control_days ?? [],
    label_records: parsed.label_records ?? [],
    intelligence_snapshots: parsed.intelligence_snapshots ?? [],
    audit_logs: parsed.audit_logs ?? [],
    refresh_tokens: parsed.refresh_tokens ?? [],
    meta: parsed.meta ?? {},
  }
}

function readDb(): DatabaseFile {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  if (!fs.existsSync(dbPath)) {
    const initial = emptyDb()
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2), 'utf8')
    return initial
  }

  try {
    return normalizeDb(JSON.parse(fs.readFileSync(dbPath, 'utf8')) as Partial<DatabaseFile>)
  } catch {
    return emptyDb()
  }
}

function writeDb(data: DatabaseFile): void {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8')
}

export function readJsonDatabaseFile(): DatabaseFile {
  return readDb()
}

export function createJsonStore(): DatabaseStore {
  return {
    async init() {
      readDb()
    },

    async getMeta(key) {
      return readDb().meta[key] ?? null
    },

    async setMeta(key, value) {
      const db = readDb()
      db.meta[key] = value
      writeDb(db)
    },

    async countUsers() {
      return readDb().users.length
    },

    async insertUser(user) {
      const db = readDb()
      db.users.push(user)
      writeDb(db)
    },

    async findUserByEmail(email) {
      const normalized = email.trim().toLowerCase()
      return readDb().users.find((user) => user.email.toLowerCase() === normalized)
    },

    async findUserById(id) {
      return readDb().users.find((user) => user.id === id)
    },

    async findUserByEmployeeId(employeeId) {
      return readDb().users.find((user) => user.employee_id === employeeId)
    },

    async updateUserPassword(id, passwordHash, passwordPlain) {
      const db = readDb()
      const index = db.users.findIndex((user) => user.id === id)
      if (index < 0) {
        throw new Error('Usuário não encontrado.')
      }
      db.users[index] = {
        ...db.users[index],
        password_hash: passwordHash,
        password_plain: passwordPlain,
      }
      writeDb(db)
    },

    async updateUserIdentity(id, input) {
      const db = readDb()
      const index = db.users.findIndex((user) => user.id === id)
      if (index < 0) {
        throw new Error('Usuário não encontrado.')
      }
      db.users[index] = {
        ...db.users[index],
        name: input.name,
        email: input.email.trim().toLowerCase(),
      }
      writeDb(db)
    },

    async updateUserEmployeeId(id, employeeId) {
      const db = readDb()
      const index = db.users.findIndex((user) => user.id === id)
      if (index < 0) {
        throw new Error('Usuário não encontrado.')
      }
      db.users[index] = {
        ...db.users[index],
        employee_id: employeeId,
      }
      writeDb(db)
    },

    async updateUserRole(id, role) {
      const db = readDb()
      const index = db.users.findIndex((user) => user.id === id)
      if (index < 0) {
        throw new Error('Usuário não encontrado.')
      }
      db.users[index] = {
        ...db.users[index],
        role,
      }
      writeDb(db)
    },

    async deleteRefreshTokensForUser(userId) {
      const db = readDb()
      db.refresh_tokens = db.refresh_tokens.filter((item) => item.user_id !== userId)
      writeDb(db)
    },

    async countProductions() {
      return readDb().productions.length
    },

    async saveProductionRecord(production) {
      const db = readDb()
      const index = db.productions.findIndex((item) => item.id === production.id)
      if (index >= 0) {
        db.productions[index] = production
      } else {
        db.productions.push(production)
      }
      writeDb(db)
    },

    async loadProductionRecord(id) {
      return readDb().productions.find((item) => item.id === id) ?? null
    },

    async loadAllProductionRecords() {
      return readDb().productions
    },

    async loadProductionRecordsInMonth(year, month) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`
      const endMonth = month === 12 ? 1 : month + 1
      const endYear = month === 12 ? year + 1 : year
      const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`
      return readDb().productions.filter((item) => item.date >= start && item.date < end)
    },

    async deleteProductionRecord(id) {
      const db = readDb()
      db.productions = db.productions.filter((item) => item.id !== id)
      writeDb(db)
    },

    async insertRefreshToken(token, userId, expiresAt) {
      const db = readDb()
      db.refresh_tokens.push({ token, user_id: userId, expires_at: expiresAt })
      writeDb(db)
    },

    async deleteRefreshToken(token) {
      const db = readDb()
      db.refresh_tokens = db.refresh_tokens.filter((item) => item.token !== token)
      writeDb(db)
    },

    async findRefreshToken(token, userId) {
      return readDb().refresh_tokens.find((item) => item.token === token && item.user_id === userId) ?? null
    },

    async countRecipes() {
      return readDb().recipes.length
    },

    async loadAllRecipes() {
      return readDb().recipes
    },

    async listRecipesPaginated(query: RecipeListQuery): Promise<PaginatedRecipes> {
      return listRecipesFromMemory(readDb().recipes, query)
    },

    async getRecipeStats(): Promise<RecipeStats> {
      return computeRecipeStats(readDb().recipes)
    },

    async loadRecipeRecord(id) {
      return readDb().recipes.find((recipe) => recipe.id === id) ?? null
    },

    async saveRecipeRecord(recipe) {
      const db = readDb()
      const index = db.recipes.findIndex((item) => item.id === recipe.id)
      if (index >= 0) {
        db.recipes[index] = recipe
      } else {
        db.recipes.push(recipe)
      }
      writeDb(db)
    },

    async deleteRecipeRecord(id) {
      const db = readDb()
      db.recipes = db.recipes.filter((item) => item.id !== id)
      writeDb(db)
    },

    async countProducts() {
      return readDb().products.length
    },

    async loadAllProducts() {
      return readDb().products
    },

    async loadProductRecord(id) {
      return readDb().products.find((product) => product.id === id) ?? null
    },

    async saveProductRecord(product) {
      const db = readDb()
      const index = db.products.findIndex((item) => item.id === product.id)
      if (index >= 0) {
        db.products[index] = product
      } else {
        db.products.push(product)
      }
      writeDb(db)
    },

    async deleteProductRecord(id) {
      const db = readDb()
      db.products = db.products.filter((item) => item.id !== id)
      writeDb(db)
    },

    async countMonthlySchedules() {
      return readDb().monthly_schedules.length
    },

    async loadAllMonthlySchedules() {
      return readDb().monthly_schedules
    },

    async loadMonthlyScheduleRecord(id) {
      return readDb().monthly_schedules.find((schedule) => schedule.id === id) ?? null
    },

    async saveMonthlyScheduleRecord(schedule) {
      const db = readDb()
      const index = db.monthly_schedules.findIndex((item) => item.id === schedule.id)
      if (index >= 0) {
        db.monthly_schedules[index] = schedule
      } else {
        db.monthly_schedules.push(schedule)
      }
      writeDb(db)
    },

    async loadBreadControlDay(id) {
      return readDb().bread_control_days.find((day) => day.id === id) ?? null
    },

    async loadBreadControlDaysInMonth(year, month) {
      const prefix = `${year}-${String(month).padStart(2, '0')}-`
      return readDb().bread_control_days.filter((day) => day.date.startsWith(prefix))
    },

    async saveBreadControlDay(day) {
      const db = readDb()
      const index = db.bread_control_days.findIndex((item) => item.id === day.id)
      if (index >= 0) {
        db.bread_control_days[index] = day
      } else {
        db.bread_control_days.push(day)
      }
      writeDb(db)
    },

    async loadWasteControlDay(id) {
      return readDb().waste_control_days.find((day) => day.id === id) ?? null
    },

    async loadWasteControlDaysInMonth(year, month) {
      const prefix = `${year}-${String(month).padStart(2, '0')}-`
      return readDb().waste_control_days.filter((day) => day.date.startsWith(prefix))
    },

    async saveWasteControlDay(day) {
      const db = readDb()
      const index = db.waste_control_days.findIndex((item) => item.id === day.id)
      if (index >= 0) {
        db.waste_control_days[index] = day
      } else {
        db.waste_control_days.push(day)
      }
      writeDb(db)
    },

    async loadLabelRecord(id) {
      return readDb().label_records.find((record) => record.id === id) ?? null
    },

    async loadAllLabelRecords() {
      return [...readDb().label_records]
    },

    async saveLabelRecord(record) {
      const db = readDb()
      const index = db.label_records.findIndex((item) => item.id === record.id)
      if (index >= 0) {
        db.label_records[index] = record
      } else {
        db.label_records.push(record)
      }
      writeDb(db)
    },

    async loadIntelligenceSnapshot(id) {
      const snapshot = readDb().intelligence_snapshots.find((item) => item.id === id) ?? null
      return snapshot as import('../intelligence/types.js').IntelligenceSnapshot | null
    },

    async loadIntelligenceSnapshotsByPeriod(year, month, category) {
      return readDb().intelligence_snapshots.filter((item) => {
        if (item.period.year !== year || item.period.month !== month) {
          return false
        }
        if (category && item.category !== category) {
          return false
        }
        return true
      })
    },

    async saveIntelligenceSnapshot(snapshot) {
      const db = readDb()
      const index = db.intelligence_snapshots.findIndex((item) => item.id === snapshot.id)
      if (index >= 0) {
        db.intelligence_snapshots[index] = snapshot
      } else {
        db.intelligence_snapshots.push(snapshot)
      }
      writeDb(db)
    },

    async deleteIntelligenceSnapshotsByPeriod(year, month, category) {
      const db = readDb()
      db.intelligence_snapshots = db.intelligence_snapshots.filter((item) => {
        if (item.period.year !== year || item.period.month !== month) {
          return true
        }
        if (category && item.category !== category) {
          return true
        }
        return false
      })
      writeDb(db)
    },

    async insertAuditLog(record) {
      const db = readDb()
      db.audit_logs.unshift(record)
      if (db.audit_logs.length > 5000) {
        db.audit_logs = db.audit_logs.slice(0, 5000)
      }
      writeDb(db)
    },

    async listAuditLogs(filters) {
      const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200)
      const offset = Math.max(filters.offset ?? 0, 0)

      let items = [...readDb().audit_logs]

      if (filters.entityType) {
        items = items.filter((item) => item.entityType === filters.entityType)
      }
      if (filters.entityId) {
        items = items.filter((item) => item.entityId === filters.entityId)
      }
      if (filters.actorId) {
        items = items.filter((item) => item.actor.userId === filters.actorId)
      }
      if (filters.action) {
        items = items.filter((item) => item.action === filters.action)
      }
      if (filters.from) {
        items = items.filter((item) => item.createdAt >= filters.from!)
      }
      if (filters.to) {
        items = items.filter((item) => item.createdAt <= filters.to!)
      }

      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

      return {
        total: items.length,
        items: items.slice(offset, offset + limit),
      }
    },
  }
}

export type { UserRow, RefreshTokenRow }
