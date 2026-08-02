import type { AppUser, BreadControlDay, MonthlySchedule, ProductionDay, Recipe, WasteControlDay } from '../types.js'

export interface UserRow {
  id: string
  email: string
  password_hash: string
  password_plain: string | null
  role: AppUser['role']
  employee_id: string | null
  name: string
}

export interface RefreshTokenRow {
  token: string
  user_id: string
  expires_at: string
}

export interface DatabaseFile {
  users: UserRow[]
  productions: ProductionDay[]
  recipes: Recipe[]
  monthly_schedules: MonthlySchedule[]
  bread_control_days: BreadControlDay[]
  waste_control_days: WasteControlDay[]
  refresh_tokens: RefreshTokenRow[]
  meta: Record<string, string>
}

export interface DatabaseStore {
  init(): Promise<void>
  getMeta(key: string): Promise<string | null>
  setMeta(key: string, value: string): Promise<void>
  countUsers(): Promise<number>
  insertUser(user: UserRow): Promise<void>
  findUserByEmail(email: string): Promise<UserRow | undefined>
  findUserById(id: string): Promise<UserRow | undefined>
  findUserByEmployeeId(employeeId: string): Promise<UserRow | undefined>
  updateUserPassword(id: string, passwordHash: string, passwordPlain: string): Promise<void>
  deleteRefreshTokensForUser(userId: string): Promise<void>
  countProductions(): Promise<number>
  saveProductionRecord(production: ProductionDay): Promise<void>
  loadProductionRecord(id: string): Promise<ProductionDay | null>
  loadAllProductionRecords(): Promise<ProductionDay[]>
  deleteProductionRecord(id: string): Promise<void>
  insertRefreshToken(token: string, userId: string, expiresAt: string): Promise<void>
  deleteRefreshToken(token: string): Promise<void>
  findRefreshToken(token: string, userId: string): Promise<RefreshTokenRow | null>
  countRecipes(): Promise<number>
  loadAllRecipes(): Promise<Recipe[]>
  loadRecipeRecord(id: string): Promise<Recipe | null>
  saveRecipeRecord(recipe: Recipe): Promise<void>
  deleteRecipeRecord(id: string): Promise<void>
  countMonthlySchedules(): Promise<number>
  loadAllMonthlySchedules(): Promise<MonthlySchedule[]>
  loadMonthlyScheduleRecord(id: string): Promise<MonthlySchedule | null>
  saveMonthlyScheduleRecord(schedule: MonthlySchedule): Promise<void>
  loadBreadControlDay(id: string): Promise<BreadControlDay | null>
  loadBreadControlDaysInMonth(year: number, month: number): Promise<BreadControlDay[]>
  saveBreadControlDay(day: BreadControlDay): Promise<void>
  loadWasteControlDay(id: string): Promise<WasteControlDay | null>
  loadWasteControlDaysInMonth(year: number, month: number): Promise<WasteControlDay[]>
  saveWasteControlDay(day: WasteControlDay): Promise<void>
}
