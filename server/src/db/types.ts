import type {
  AppUser,
  BreadControlDay,
  CatalogProduct,
  EmployeeAbsencePeriod,
  LabelRecord,
  MonthlySchedule,
  ProductionDay,
  Recipe,
  WasteControlDay,
} from '../types.js'
import type { WasteControlSector } from '../wasteControl/sectors.js'
import type { AuditLogRecord } from '../audit/types.js'
import type { IntelligenceSnapshot } from '../intelligence/types.js'
import type { PaginatedRecipes, RecipeListQuery, RecipeStats } from '../types.js'

export interface UserRow {
  id: string
  email: string
  password_hash: string
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
  products: CatalogProduct[]
  monthly_schedules: MonthlySchedule[]
  employee_absences: EmployeeAbsencePeriod[]
  bread_control_days: BreadControlDay[]
  waste_control_days: WasteControlDay[]
  label_records: LabelRecord[]
  intelligence_snapshots: IntelligenceSnapshot[]
  audit_logs: AuditLogRecord[]
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
  updateUserPassword(id: string, passwordHash: string): Promise<void>
  updateUserIdentity(id: string, input: { name: string; email: string }): Promise<void>
  updateUserEmployeeId(id: string, employeeId: string | null): Promise<void>
  updateUserRole(id: string, role: AppUser['role']): Promise<void>
  deleteRefreshTokensForUser(userId: string): Promise<void>
  countProductions(): Promise<number>
  saveProductionRecord(production: ProductionDay): Promise<void>
  loadProductionRecord(id: string): Promise<ProductionDay | null>
  findProductionByEmployeeAndDate(employeeId: string, date: string): Promise<ProductionDay | null>
  loadAllProductionRecords(): Promise<ProductionDay[]>
  loadProductionRecordsInMonth(year: number, month: number): Promise<ProductionDay[]>
  deleteProductionRecord(id: string): Promise<void>
  insertRefreshToken(token: string, userId: string, expiresAt: string): Promise<void>
  deleteRefreshToken(token: string): Promise<void>
  findRefreshToken(token: string, userId: string): Promise<RefreshTokenRow | null>
  countRecipes(): Promise<number>
  loadAllRecipes(): Promise<Recipe[]>
  listRecipesPaginated(query: RecipeListQuery): Promise<PaginatedRecipes>
  getRecipeStats(): Promise<RecipeStats>
  loadRecipeRecord(id: string): Promise<Recipe | null>
  saveRecipeRecord(recipe: Recipe): Promise<void>
  deleteRecipeRecord(id: string): Promise<void>
  countProducts(): Promise<number>
  loadAllProducts(): Promise<CatalogProduct[]>
  loadProductRecord(id: string): Promise<CatalogProduct | null>
  saveProductRecord(product: CatalogProduct): Promise<void>
  deleteProductRecord(id: string): Promise<void>
  countMonthlySchedules(): Promise<number>
  loadAllMonthlySchedules(): Promise<MonthlySchedule[]>
  loadMonthlyScheduleRecord(id: string): Promise<MonthlySchedule | null>
  saveMonthlyScheduleRecord(schedule: MonthlySchedule): Promise<void>
  loadEmployeeAbsenceRecord(id: string): Promise<EmployeeAbsencePeriod | null>
  loadEmployeeAbsencesByEmployee(employeeId: string): Promise<EmployeeAbsencePeriod[]>
  loadEmployeeAbsencesOverlappingRange(
    startDate: string,
    endDate: string,
  ): Promise<EmployeeAbsencePeriod[]>
  saveEmployeeAbsenceRecord(absence: EmployeeAbsencePeriod): Promise<void>
  loadBreadControlDay(id: string): Promise<BreadControlDay | null>
  loadBreadControlDaysInMonth(year: number, month: number): Promise<BreadControlDay[]>
  saveBreadControlDay(day: BreadControlDay): Promise<void>
  loadWasteControlDay(id: string): Promise<WasteControlDay | null>
  loadWasteControlDayByDateAndSector(
    operationalDate: string,
    sector: WasteControlSector,
  ): Promise<WasteControlDay | null>
  loadWasteControlDaysInMonth(year: number, month: number): Promise<WasteControlDay[]>
  saveWasteControlDay(day: WasteControlDay): Promise<void>
  loadLabelRecord(id: string): Promise<LabelRecord | null>
  loadAllLabelRecords(): Promise<LabelRecord[]>
  saveLabelRecord(record: LabelRecord): Promise<void>
  loadIntelligenceSnapshot(id: string): Promise<IntelligenceSnapshot | null>
  loadIntelligenceSnapshotsByPeriod(
    year: number,
    month: number,
    category?: IntelligenceSnapshot['category'],
  ): Promise<IntelligenceSnapshot[]>
  saveIntelligenceSnapshot(snapshot: IntelligenceSnapshot): Promise<void>
  deleteIntelligenceSnapshotsByPeriod(
    year: number,
    month: number,
    category?: IntelligenceSnapshot['category'],
  ): Promise<void>
  insertAuditLog(record: AuditLogRecord): Promise<void>
  listAuditLogs(filters: import('../audit/types.js').AuditLogFilters): Promise<import('../audit/types.js').AuditLogListResult>
}
