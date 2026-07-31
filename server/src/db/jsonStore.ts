import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'
import type { DatabaseFile, DatabaseStore, RefreshTokenRow, UserRow } from './types.js'
import type { BreadControlDay, MonthlySchedule, ProductionDay, Recipe } from '../types.js'

const dbPath = path.join(config.dataDir, 'nannai.json')

function emptyDb(): DatabaseFile {
  return {
    users: [],
    productions: [],
    recipes: [],
    monthly_schedules: [],
    bread_control_days: [],
    refresh_tokens: [],
    meta: {},
  }
}

function normalizeDb(parsed: Partial<DatabaseFile>): DatabaseFile {
  return {
    users: parsed.users ?? [],
    productions: parsed.productions ?? [],
    recipes: parsed.recipes ?? [],
    monthly_schedules: parsed.monthly_schedules ?? [],
    bread_control_days: parsed.bread_control_days ?? [],
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
  }
}

export type { UserRow, RefreshTokenRow }
