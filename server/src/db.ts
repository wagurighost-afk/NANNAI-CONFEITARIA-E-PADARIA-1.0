import fs from 'node:fs'
import path from 'node:path'
import { config } from './config.js'
import type { AppUser, MonthlySchedule, ProductionDay, Recipe } from './types.js'

export interface UserRow {
  id: string
  email: string
  password_hash: string
  role: AppUser['role']
  employee_id: string | null
  name: string
}

interface RefreshTokenRow {
  token: string
  user_id: string
  expires_at: string
}

interface DatabaseFile {
  users: UserRow[]
  productions: ProductionDay[]
  recipes: Recipe[]
  monthly_schedules: MonthlySchedule[]
  refresh_tokens: RefreshTokenRow[]
  meta: Record<string, string>
}

const dbPath = path.join(path.dirname(config.dbPath), 'nannai.json')

function emptyDb(): DatabaseFile {
  return { users: [], productions: [], recipes: [], monthly_schedules: [], refresh_tokens: [], meta: {} }
}

function normalizeDb(parsed: Partial<DatabaseFile>): DatabaseFile {
  return {
    users: parsed.users ?? [],
    productions: parsed.productions ?? [],
    recipes: parsed.recipes ?? [],
    monthly_schedules: parsed.monthly_schedules ?? [],
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

export function getMeta(key: string): string | null {
  const db = readDb()
  return db.meta[key] ?? null
}

export function setMeta(key: string, value: string): void {
  const db = readDb()
  db.meta[key] = value
  writeDb(db)
}

export function countUsers(): number {
  return readDb().users.length
}

export function insertUser(user: UserRow): void {
  const db = readDb()
  db.users.push(user)
  writeDb(db)
}

export function countProductions(): number {
  return readDb().productions.length
}

export function saveProductionRecord(production: ProductionDay): void {
  const db = readDb()
  const index = db.productions.findIndex((item) => item.id === production.id)
  if (index >= 0) {
    db.productions[index] = production
  } else {
    db.productions.push(production)
  }
  writeDb(db)
}

export function loadProductionRecord(id: string): ProductionDay | null {
  const db = readDb()
  return db.productions.find((item) => item.id === id) ?? null
}

export function loadAllProductionRecords(): ProductionDay[] {
  return readDb().productions
}

export function deleteProductionRecord(id: string): void {
  const db = readDb()
  db.productions = db.productions.filter((item) => item.id !== id)
  writeDb(db)
}

export function insertRefreshToken(token: string, userId: string, expiresAt: string): void {
  const db = readDb()
  db.refresh_tokens.push({ token, user_id: userId, expires_at: expiresAt })
  writeDb(db)
}

export function deleteRefreshToken(token: string): void {
  const db = readDb()
  db.refresh_tokens = db.refresh_tokens.filter((item) => item.token !== token)
  writeDb(db)
}

export function findRefreshToken(token: string, userId: string): RefreshTokenRow | null {
  const db = readDb()
  return db.refresh_tokens.find((item) => item.token === token && item.user_id === userId) ?? null
}

export function findUserByEmail(email: string): UserRow | undefined {
  const normalized = email.trim().toLowerCase()
  return readDb().users.find((user) => user.email.toLowerCase() === normalized)
}

export function findUserById(id: string): UserRow | undefined {
  return readDb().users.find((user) => user.id === id)
}

export function ensureUploadsDir(): void {
  fs.mkdirSync(config.uploadsDir, { recursive: true })
}

export function countRecipes(): number {
  return readDb().recipes.length
}

export function loadAllRecipes(): Recipe[] {
  return readDb().recipes
}

export function loadRecipeRecord(id: string): Recipe | null {
  return readDb().recipes.find((recipe) => recipe.id === id) ?? null
}

export function saveRecipeRecord(recipe: Recipe): void {
  const db = readDb()
  const index = db.recipes.findIndex((item) => item.id === recipe.id)
  if (index >= 0) {
    db.recipes[index] = recipe
  } else {
    db.recipes.push(recipe)
  }
  writeDb(db)
}

export function deleteRecipeRecord(id: string): void {
  const db = readDb()
  db.recipes = db.recipes.filter((item) => item.id !== id)
  writeDb(db)
}

export function countMonthlySchedules(): number {
  return readDb().monthly_schedules.length
}

export function loadAllMonthlySchedules(): MonthlySchedule[] {
  return readDb().monthly_schedules
}

export function loadMonthlyScheduleRecord(id: string): MonthlySchedule | null {
  return readDb().monthly_schedules.find((schedule) => schedule.id === id) ?? null
}

export function saveMonthlyScheduleRecord(schedule: MonthlySchedule): void {
  const db = readDb()
  const index = db.monthly_schedules.findIndex((item) => item.id === schedule.id)
  if (index >= 0) {
    db.monthly_schedules[index] = schedule
  } else {
    db.monthly_schedules.push(schedule)
  }
  writeDb(db)
}
