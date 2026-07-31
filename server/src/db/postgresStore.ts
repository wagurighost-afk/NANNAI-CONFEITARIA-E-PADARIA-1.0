import pg from 'pg'
import { config } from '../config.js'
import { readJsonDatabaseFile } from './jsonStore.js'
import type { DatabaseFile, DatabaseStore } from './types.js'
import type { BreadControlDay, MonthlySchedule, ProductionDay, Recipe } from '../types.js'

const { Pool } = pg

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  employee_id TEXT,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS productions (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS monthly_schedules (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS bread_control_days (
  id TEXT PRIMARY KEY,
  record_date DATE NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bread_control_days_record_date ON bread_control_days(record_date);
`

async function importJsonIfEmpty(pool: pg.Pool): Promise<void> {
  const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users')
  if (Number(rows[0]?.count ?? 0) > 0) {
    return
  }

  let snapshot: DatabaseFile
  try {
    snapshot = readJsonDatabaseFile()
  } catch {
    return
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    for (const user of snapshot.users) {
      await client.query(
        `INSERT INTO users (id, email, password_hash, role, employee_id, name)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [user.id, user.email, user.password_hash, user.role, user.employee_id, user.name],
      )
    }

    for (const [key, value] of Object.entries(snapshot.meta)) {
      await client.query(
        `INSERT INTO meta (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, value],
      )
    }

    for (const production of snapshot.productions) {
      await client.query(
        `INSERT INTO productions (id, payload) VALUES ($1, $2::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [production.id, JSON.stringify(production)],
      )
    }

    for (const recipe of snapshot.recipes) {
      await client.query(
        `INSERT INTO recipes (id, payload) VALUES ($1, $2::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [recipe.id, JSON.stringify(recipe)],
      )
    }

    for (const schedule of snapshot.monthly_schedules) {
      await client.query(
        `INSERT INTO monthly_schedules (id, payload) VALUES ($1, $2::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [schedule.id, JSON.stringify(schedule)],
      )
    }

    for (const day of snapshot.bread_control_days) {
      await client.query(
        `INSERT INTO bread_control_days (id, record_date, payload) VALUES ($1, $2::date, $3::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [day.id, day.date, JSON.stringify(day)],
      )
    }

    for (const token of snapshot.refresh_tokens) {
      await client.query(
        `INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3::timestamptz)
         ON CONFLICT (token) DO NOTHING`,
        [token.token, token.user_id, token.expires_at],
      )
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export function createPostgresStore(): DatabaseStore {
  const pool = new Pool({
    connectionString: config.databaseUrl ?? undefined,
    ssl: process.env.PGSSLMODE === 'require' || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : undefined,
  })

  return {
    async init() {
      await pool.query(SCHEMA_SQL)
      await importJsonIfEmpty(pool)
    },

    async getMeta(key) {
      const { rows } = await pool.query<{ value: string }>('SELECT value FROM meta WHERE key = $1', [key])
      return rows[0]?.value ?? null
    },

    async setMeta(key, value) {
      await pool.query(
        `INSERT INTO meta (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, value],
      )
    },

    async countUsers() {
      const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users')
      return Number(rows[0]?.count ?? 0)
    },

    async insertUser(user) {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, role, employee_id, name)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, user.email, user.password_hash, user.role, user.employee_id, user.name],
      )
    },

    async findUserByEmail(email) {
      const normalized = email.trim().toLowerCase()
      const { rows } = await pool.query(
        'SELECT id, email, password_hash, role, employee_id, name FROM users WHERE LOWER(email) = $1 LIMIT 1',
        [normalized],
      )
      return rows[0] ?? undefined
    },

    async findUserById(id) {
      const { rows } = await pool.query(
        'SELECT id, email, password_hash, role, employee_id, name FROM users WHERE id = $1 LIMIT 1',
        [id],
      )
      return rows[0] ?? undefined
    },

    async countProductions() {
      const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM productions')
      return Number(rows[0]?.count ?? 0)
    },

    async saveProductionRecord(production) {
      await pool.query(
        `INSERT INTO productions (id, payload) VALUES ($1, $2::jsonb)
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
        [production.id, JSON.stringify(production)],
      )
    },

    async loadProductionRecord(id) {
      const { rows } = await pool.query<{ payload: ProductionDay }>(
        'SELECT payload FROM productions WHERE id = $1',
        [id],
      )
      return rows[0]?.payload ?? null
    },

    async loadAllProductionRecords() {
      const { rows } = await pool.query<{ payload: ProductionDay }>('SELECT payload FROM productions')
      return rows.map((row) => row.payload)
    },

    async deleteProductionRecord(id) {
      await pool.query('DELETE FROM productions WHERE id = $1', [id])
    },

    async insertRefreshToken(token, userId, expiresAt) {
      await pool.query(
        'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3::timestamptz)',
        [token, userId, expiresAt],
      )
    },

    async deleteRefreshToken(token) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token])
    },

    async findRefreshToken(token, userId) {
      const { rows } = await pool.query(
        'SELECT token, user_id, expires_at FROM refresh_tokens WHERE token = $1 AND user_id = $2 LIMIT 1',
        [token, userId],
      )
      return rows[0] ?? null
    },

    async countRecipes() {
      const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM recipes')
      return Number(rows[0]?.count ?? 0)
    },

    async loadAllRecipes() {
      const { rows } = await pool.query<{ payload: Recipe }>('SELECT payload FROM recipes')
      return rows.map((row) => row.payload)
    },

    async loadRecipeRecord(id) {
      const { rows } = await pool.query<{ payload: Recipe }>('SELECT payload FROM recipes WHERE id = $1', [id])
      return rows[0]?.payload ?? null
    },

    async saveRecipeRecord(recipe) {
      await pool.query(
        `INSERT INTO recipes (id, payload) VALUES ($1, $2::jsonb)
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
        [recipe.id, JSON.stringify(recipe)],
      )
    },

    async deleteRecipeRecord(id) {
      await pool.query('DELETE FROM recipes WHERE id = $1', [id])
    },

    async countMonthlySchedules() {
      const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM monthly_schedules')
      return Number(rows[0]?.count ?? 0)
    },

    async loadAllMonthlySchedules() {
      const { rows } = await pool.query<{ payload: MonthlySchedule }>('SELECT payload FROM monthly_schedules')
      return rows.map((row) => row.payload)
    },

    async loadMonthlyScheduleRecord(id) {
      const { rows } = await pool.query<{ payload: MonthlySchedule }>(
        'SELECT payload FROM monthly_schedules WHERE id = $1',
        [id],
      )
      return rows[0]?.payload ?? null
    },

    async saveMonthlyScheduleRecord(schedule) {
      await pool.query(
        `INSERT INTO monthly_schedules (id, payload) VALUES ($1, $2::jsonb)
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
        [schedule.id, JSON.stringify(schedule)],
      )
    },

    async loadBreadControlDay(id) {
      const { rows } = await pool.query<{ payload: BreadControlDay }>(
        'SELECT payload FROM bread_control_days WHERE id = $1',
        [id],
      )
      return rows[0]?.payload ?? null
    },

    async loadBreadControlDaysInMonth(year, month) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`
      const endMonth = month === 12 ? 1 : month + 1
      const endYear = month === 12 ? year + 1 : year
      const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`
      const { rows } = await pool.query<{ payload: BreadControlDay }>(
        `SELECT payload FROM bread_control_days
         WHERE record_date >= $1::date AND record_date < $2::date
         ORDER BY record_date ASC`,
        [start, end],
      )
      return rows.map((row) => row.payload)
    },

    async saveBreadControlDay(day) {
      await pool.query(
        `INSERT INTO bread_control_days (id, record_date, payload) VALUES ($1, $2::date, $3::jsonb)
         ON CONFLICT (id) DO UPDATE SET record_date = EXCLUDED.record_date, payload = EXCLUDED.payload`,
        [day.id, day.date, JSON.stringify(day)],
      )
    },
  }
}
