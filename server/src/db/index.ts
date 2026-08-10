import fs from 'node:fs'
import { config } from '../config.js'
import { createJsonStore } from './jsonStore.js'
import { createPostgresStore } from './postgresStore.js'
import type { DatabaseStore } from './types.js'

export type { UserRow, RefreshTokenRow } from './jsonStore.js'

let store: DatabaseStore | null = null

function getStore(): DatabaseStore {
  if (!store) {
    throw new Error('Banco de dados não inicializado.')
  }
  return store
}

export async function initDatabase(): Promise<void> {
  store = config.databaseUrl ? createPostgresStore() : createJsonStore()
  await store.init()
  fs.mkdirSync(config.uploadsDir, { recursive: true })
  fs.mkdirSync(config.dataDir, { recursive: true })
}

export function ensureUploadsDir(): void {
  fs.mkdirSync(config.uploadsDir, { recursive: true })
}

export async function getMeta(key: string): Promise<string | null> {
  return getStore().getMeta(key)
}

export async function setMeta(key: string, value: string): Promise<void> {
  await getStore().setMeta(key, value)
}

export async function countUsers(): Promise<number> {
  return getStore().countUsers()
}

export async function insertUser(...args: Parameters<DatabaseStore['insertUser']>): Promise<void> {
  await getStore().insertUser(...args)
}

export async function findUserByEmail(email: string) {
  return getStore().findUserByEmail(email)
}

export async function findUserById(id: string) {
  return getStore().findUserById(id)
}

export async function findUserByEmployeeId(employeeId: string) {
  return getStore().findUserByEmployeeId(employeeId)
}

export async function updateUserPassword(
  id: string,
  passwordHash: string,
  passwordPlain: string,
): Promise<void> {
  await getStore().updateUserPassword(id, passwordHash, passwordPlain)
}

export async function updateUserIdentity(
  id: string,
  input: { name: string; email: string },
): Promise<void> {
  await getStore().updateUserIdentity(id, input)
}

export async function updateUserEmployeeId(id: string, employeeId: string | null): Promise<void> {
  await getStore().updateUserEmployeeId(id, employeeId)
}

export async function updateUserRole(id: string, role: import('../types.js').AppUser['role']): Promise<void> {
  await getStore().updateUserRole(id, role)
}

export async function deleteRefreshTokensForUser(userId: string): Promise<void> {
  await getStore().deleteRefreshTokensForUser(userId)
}

export async function countProductions(): Promise<number> {
  return getStore().countProductions()
}

export async function saveProductionRecord(production: Parameters<DatabaseStore['saveProductionRecord']>[0]): Promise<void> {
  await getStore().saveProductionRecord(production)
}

export async function loadProductionRecord(id: string) {
  return getStore().loadProductionRecord(id)
}

export async function findProductionByEmployeeAndDate(employeeId: string, date: string) {
  return getStore().findProductionByEmployeeAndDate(employeeId, date)
}

export async function loadAllProductionRecords() {
  return getStore().loadAllProductionRecords()
}

export async function loadProductionRecordsInMonth(year: number, month: number) {
  return getStore().loadProductionRecordsInMonth(year, month)
}

export async function deleteProductionRecord(id: string): Promise<void> {
  await getStore().deleteProductionRecord(id)
}

export async function insertRefreshToken(token: string, userId: string, expiresAt: string): Promise<void> {
  await getStore().insertRefreshToken(token, userId, expiresAt)
}

export async function deleteRefreshToken(token: string): Promise<void> {
  await getStore().deleteRefreshToken(token)
}

export async function findRefreshToken(token: string, userId: string) {
  return getStore().findRefreshToken(token, userId)
}

export async function countRecipes(): Promise<number> {
  return getStore().countRecipes()
}

export async function loadAllRecipes() {
  return getStore().loadAllRecipes()
}

export async function listRecipesPaginated(query: Parameters<DatabaseStore['listRecipesPaginated']>[0]) {
  return getStore().listRecipesPaginated(query)
}

export async function getRecipeStats() {
  return getStore().getRecipeStats()
}

export async function loadRecipeRecord(id: string) {
  return getStore().loadRecipeRecord(id)
}

export async function saveRecipeRecord(recipe: Parameters<DatabaseStore['saveRecipeRecord']>[0]): Promise<void> {
  await getStore().saveRecipeRecord(recipe)
}

export async function deleteRecipeRecord(id: string): Promise<void> {
  await getStore().deleteRecipeRecord(id)
}

export async function countMonthlySchedules(): Promise<number> {
  return getStore().countMonthlySchedules()
}

export async function loadAllMonthlySchedules() {
  return getStore().loadAllMonthlySchedules()
}

export async function loadMonthlyScheduleRecord(id: string) {
  return getStore().loadMonthlyScheduleRecord(id)
}

export async function saveMonthlyScheduleRecord(schedule: Parameters<DatabaseStore['saveMonthlyScheduleRecord']>[0]): Promise<void> {
  await getStore().saveMonthlyScheduleRecord(schedule)
}

export async function countProducts(): Promise<number> {
  return getStore().countProducts()
}

export async function loadAllProducts() {
  return getStore().loadAllProducts()
}

export async function loadProductRecord(id: string) {
  return getStore().loadProductRecord(id)
}

export async function saveProductRecord(product: Parameters<DatabaseStore['saveProductRecord']>[0]): Promise<void> {
  await getStore().saveProductRecord(product)
}

export async function deleteProductRecord(id: string): Promise<void> {
  await getStore().deleteProductRecord(id)
}

export async function loadBreadControlDay(id: string) {
  return getStore().loadBreadControlDay(id)
}

export async function loadBreadControlDaysInMonth(year: number, month: number) {
  return getStore().loadBreadControlDaysInMonth(year, month)
}

export async function saveBreadControlDay(day: Parameters<DatabaseStore['saveBreadControlDay']>[0]): Promise<void> {
  await getStore().saveBreadControlDay(day)
}

export async function loadWasteControlDay(id: string) {
  return getStore().loadWasteControlDay(id)
}

export async function loadWasteControlDaysInMonth(year: number, month: number) {
  return getStore().loadWasteControlDaysInMonth(year, month)
}

export async function saveWasteControlDay(day: Parameters<DatabaseStore['saveWasteControlDay']>[0]): Promise<void> {
  await getStore().saveWasteControlDay(day)
}

export async function loadLabelRecord(id: string) {
  return getStore().loadLabelRecord(id)
}

export async function loadAllLabelRecords() {
  return getStore().loadAllLabelRecords()
}

export async function saveLabelRecord(record: Parameters<DatabaseStore['saveLabelRecord']>[0]): Promise<void> {
  await getStore().saveLabelRecord(record)
}

export async function loadIntelligenceSnapshot<TData = unknown>(id: string) {
  const snapshot = await getStore().loadIntelligenceSnapshot(id)
  return snapshot as import('../intelligence/types.js').IntelligenceSnapshot<TData> | null
}

export async function loadIntelligenceSnapshotsByPeriod(
  year: number,
  month: number,
  category?: Parameters<DatabaseStore['loadIntelligenceSnapshotsByPeriod']>[2],
) {
  return getStore().loadIntelligenceSnapshotsByPeriod(year, month, category)
}

export async function saveIntelligenceSnapshot(
  snapshot: Parameters<DatabaseStore['saveIntelligenceSnapshot']>[0],
): Promise<void> {
  await getStore().saveIntelligenceSnapshot(snapshot)
}

export async function deleteIntelligenceSnapshotsByPeriod(
  year: number,
  month: number,
  category?: Parameters<DatabaseStore['deleteIntelligenceSnapshotsByPeriod']>[2],
): Promise<void> {
  await getStore().deleteIntelligenceSnapshotsByPeriod(year, month, category)
}

export async function insertAuditLog(record: Parameters<DatabaseStore['insertAuditLog']>[0]): Promise<void> {
  await getStore().insertAuditLog(record)
}

export async function listAuditLogs(filters: Parameters<DatabaseStore['listAuditLogs']>[0]) {
  return getStore().listAuditLogs(filters)
}

export function isPostgresEnabled(): boolean {
  return Boolean(config.databaseUrl)
}
