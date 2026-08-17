import pg from 'pg'
import { config } from '../config.js'
import { readJsonDatabaseFile } from './jsonStore.js'
import { ProductionDayUniqueConflictError } from './productionDayConflict.js'
import { WasteControlUniqueConflictError } from './wasteControlConflict.js'
import type { DatabaseFile, DatabaseStore } from './types.js'
import type {
  BreadControlDay,
  CatalogProduct,
  MonthlySchedule,
  ProductionDay,
  Recipe,
  WasteControlDay,
} from '../types.js'
import type { PaginatedRecipes, RecipeListQuery, RecipeStats } from '../types.js'
import { normalizeRecipeListQuery } from '../recipes/recipeQuery.js'
import { tokenizeRecipeSearch } from '../recipes/recipeSearch.js'

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

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name_key TEXT NOT NULL,
  payload JSONB NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_name_key ON products(name_key);

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

CREATE TABLE IF NOT EXISTS waste_control_days (
  id TEXT PRIMARY KEY,
  record_date DATE NOT NULL,
  buffet TEXT NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_waste_control_days_record_date ON waste_control_days(record_date);
CREATE INDEX IF NOT EXISTS idx_waste_control_days_buffet ON waste_control_days(buffet);

ALTER TABLE waste_control_days ADD COLUMN IF NOT EXISTS sector TEXT;

-- Um controle novo por dia operacional + setor. Legado (sector NULL) não entra no índice.
CREATE UNIQUE INDEX IF NOT EXISTS idx_waste_control_days_date_sector
  ON waste_control_days (record_date, sector)
  WHERE sector IN ('CONFEITARIA', 'PADARIA');

CREATE TABLE IF NOT EXISTS requisitions (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_requisitions_created_at
  ON requisitions(created_at DESC);
CREATE TABLE IF NOT EXISTS label_records (
  id TEXT PRIMARY KEY,
  printed_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_label_records_printed_at ON label_records (printed_at DESC);
CREATE INDEX IF NOT EXISTS idx_label_records_template ON label_records ((payload->>'templateId'));
CREATE INDEX IF NOT EXISTS idx_label_records_production ON label_records ((payload->>'productionId'));

CREATE TABLE IF NOT EXISTS intelligence_snapshots (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  payload JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_snapshots_period ON intelligence_snapshots (period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_intelligence_snapshots_category ON intelligence_snapshots (category);
CREATE INDEX IF NOT EXISTS idx_intelligence_snapshots_period_category ON intelligence_snapshots (period_year, period_month, category);
CREATE INDEX IF NOT EXISTS idx_productions_date ON productions ((payload->>'date'));

-- Um ProductionDay por colaborador + data operacional (idempotência / concorrência).
CREATE UNIQUE INDEX IF NOT EXISTS idx_productions_employee_operational_date
  ON productions ((payload->>'employeeId'), (payload->>'date'))
  WHERE (payload ? 'employeeId')
    AND (payload ? 'date')
    AND NULLIF(payload->>'employeeId', '') IS NOT NULL
    AND NULLIF(payload->>'date', '') IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recipes_status ON recipes ((payload->>'status'));
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes ((payload->>'category'));
CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes ((payload->>'name'));
CREATE INDEX IF NOT EXISTS idx_recipes_updated_at ON recipes ((payload->>'updatedAt'));
CREATE INDEX IF NOT EXISTS idx_recipes_usage_count ON recipes ((COALESCE((payload->>'usageCount')::int, 0)));
CREATE INDEX IF NOT EXISTS idx_recipes_last_viewed_at ON recipes ((payload->>'lastViewedAt'));

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_employee_id TEXT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  summary TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_id);
`

function isPostgresUniqueViolation(error: unknown, indexName: string): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }
  const pgError = error as { code?: string; constraint?: string; message?: string }
  if (pgError.code !== '23505') {
    return false
  }
  return (
    pgError.constraint === indexName ||
    (typeof pgError.message === 'string' && pgError.message.includes(indexName))
  )
}

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
        [
          user.id,
          user.email,
          user.password_hash,
          user.role,
          user.employee_id,
          user.name,
        ],
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

    for (const product of snapshot.products ?? []) {
      await client.query(
        `INSERT INTO products (id, name_key, payload) VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [product.id, product.nameKey, JSON.stringify(product)],
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

    for (const day of snapshot.waste_control_days ?? []) {
      await client.query(
        `INSERT INTO waste_control_days (id, record_date, buffet, sector, payload)
         VALUES ($1, $2::date, $3, $4, $5::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [day.id, day.date, day.buffet, day.sector ?? null, JSON.stringify(day)],
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
      // Migração segura: elimina o legado de senha reversível sem tocar nos hashes.
      await pool.query('ALTER TABLE users DROP COLUMN IF EXISTS password_plain')
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

    async nextRequisitionSequence(year) {
      const key = `requisition.sequence.${year}`

      const { rows } = await pool.query<{ value: string }>(
        `INSERT INTO meta (key, value)
         VALUES ($1, '1')
         ON CONFLICT (key) DO UPDATE
         SET value = (meta.value::bigint + 1)::text
         RETURNING value`,
        [key],
      )

      const value = Number(rows[0]?.value)

      if (!Number.isInteger(value) || value < 1) {
        throw new Error('Falha ao gerar sequência da requisição.')
      }

      return value
    },
    async countUsers() {
      const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users')
      return Number(rows[0]?.count ?? 0)
    },

    async insertUser(user) {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, role, employee_id, name)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          user.id,
          user.email,
          user.password_hash,
          user.role,
          user.employee_id,
          user.name,
        ],
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

    async findUserByEmployeeId(employeeId) {
      const { rows } = await pool.query(
        'SELECT id, email, password_hash, role, employee_id, name FROM users WHERE employee_id = $1 LIMIT 1',
        [employeeId],
      )
      return rows[0] ?? undefined
    },

    async updateUserPassword(id, passwordHash) {
      const { rowCount } = await pool.query(
        'UPDATE users SET password_hash = $2 WHERE id = $1',
        [id, passwordHash],
      )
      if (!rowCount) {
        throw new Error('Usuário não encontrado.')
      }
    },

    async updateUserIdentity(id, input) {
      const { rowCount } = await pool.query(
        'UPDATE users SET name = $2, email = $3 WHERE id = $1',
        [id, input.name, input.email.trim().toLowerCase()],
      )
      if (!rowCount) {
        throw new Error('Usuário não encontrado.')
      }
    },

    async updateUserEmployeeId(id, employeeId) {
      const { rowCount } = await pool.query('UPDATE users SET employee_id = $2 WHERE id = $1', [
        id,
        employeeId,
      ])
      if (!rowCount) {
        throw new Error('Usuário não encontrado.')
      }
    },

    async updateUserRole(id, role) {
      const { rowCount } = await pool.query('UPDATE users SET role = $2 WHERE id = $1', [id, role])
      if (!rowCount) {
        throw new Error('Usuário não encontrado.')
      }
    },

    async deleteRefreshTokensForUser(userId) {
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId])
    },

    async countProductions() {
      const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM productions')
      return Number(rows[0]?.count ?? 0)
    },

    async saveProductionRecord(production) {
      try {
        await pool.query(
          `INSERT INTO productions (id, payload) VALUES ($1, $2::jsonb)
           ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
          [production.id, JSON.stringify(production)],
        )
      } catch (error) {
        if (isPostgresUniqueViolation(error, 'idx_productions_employee_operational_date')) {
          throw new ProductionDayUniqueConflictError(production.employeeId, production.date)
        }
        throw error
      }
    },

    async loadProductionRecord(id) {
      const { rows } = await pool.query<{ payload: ProductionDay }>(
        'SELECT payload FROM productions WHERE id = $1',
        [id],
      )
      return rows[0]?.payload ?? null
    },

    async findProductionByEmployeeAndDate(employeeId, date) {
      const { rows } = await pool.query<{ payload: ProductionDay }>(
        `SELECT payload FROM productions
         WHERE payload->>'employeeId' = $1 AND payload->>'date' = $2
         LIMIT 1`,
        [employeeId, date],
      )
      return rows[0]?.payload ?? null
    },

    async loadAllProductionRecords() {
      const { rows } = await pool.query<{ payload: ProductionDay }>('SELECT payload FROM productions')
      return rows.map((row) => row.payload)
    },

    async loadProductionRecordsInMonth(year, month) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`
      const endMonth = month === 12 ? 1 : month + 1
      const endYear = month === 12 ? year + 1 : year
      const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`
      const { rows } = await pool.query<{ payload: ProductionDay }>(
        `SELECT payload FROM productions
         WHERE payload->>'date' >= $1 AND payload->>'date' < $2
         ORDER BY payload->>'date' ASC`,
        [start, end],
      )
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

    async listRecipesPaginated(query: RecipeListQuery): Promise<PaginatedRecipes> {
      const normalized = normalizeRecipeListQuery(query)
      const conditions: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      if (normalized.search) {
        const tokens = tokenizeRecipeSearch(normalized.search)
        for (const token of tokens) {
          const pattern = `%${token}%`
          conditions.push(`(
            COALESCE(payload->>'searchText', '') ILIKE $${paramIndex}
            OR payload->>'name' ILIKE $${paramIndex}
            OR payload->>'recipeCode' ILIKE $${paramIndex}
            OR payload->>'category' ILIKE $${paramIndex}
            OR COALESCE(payload->>'chef', '') ILIKE $${paramIndex}
            OR payload->>'preparationMethod' ILIKE $${paramIndex}
            OR COALESCE(payload->>'yield', '') ILIKE $${paramIndex}
            OR COALESCE(payload->>'finalWeight', '') ILIKE $${paramIndex}
            OR COALESCE(payload->>'notes', '') ILIKE $${paramIndex}
            OR EXISTS (
              SELECT 1
              FROM jsonb_array_elements(COALESCE(payload->'ingredients', '[]'::jsonb)) AS ingredient
              WHERE ingredient->>'name' ILIKE $${paramIndex}
            )
          )`)
          params.push(pattern)
          paramIndex += 1
        }
      }

      if (normalized.category !== 'all') {
        conditions.push(`payload->>'category' = $${paramIndex}`)
        params.push(normalized.category)
        paramIndex += 1
      }

      if (normalized.status !== 'all') {
        conditions.push(`payload->>'status' = $${paramIndex}`)
        params.push(normalized.status)
        paramIndex += 1
      }

      switch (normalized.quickFilter) {
        case 'favorites':
          conditions.push(`COALESCE((payload->>'isFavorite')::boolean, false) = true`)
          break
        case 'recent':
          conditions.push(`payload->>'lastViewedAt' IS NOT NULL`)
          break
        case 'archived':
          conditions.push(`payload->>'status' = 'Arquivada'`)
          break
        default:
          break
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      let orderClause = 'ORDER BY payload->>\'updatedAt\' DESC'
      if (normalized.quickFilter === 'recent') {
        orderClause = 'ORDER BY payload->>\'lastViewedAt\' DESC NULLS LAST'
      } else {
        const direction = normalized.sortOrder === 'asc' ? 'ASC' : 'DESC'
        switch (normalized.sortBy) {
          case 'name':
            orderClause = `ORDER BY payload->>'name' ${direction}`
            break
          case 'category':
            orderClause = `ORDER BY payload->>'category' ${direction}, payload->>'name' ASC`
            break
          case 'usage':
            orderClause = `ORDER BY COALESCE((payload->>'usageCount')::int, 0) ${direction}, payload->>'name' ASC`
            break
          case 'date':
          default:
            orderClause = `ORDER BY payload->>'updatedAt' ${direction}`
            break
        }
      }

      const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM recipes ${whereClause}`,
        params,
      )
      const total = Number(countResult.rows[0]?.count ?? 0)
      const totalPages = total === 0 ? 0 : Math.max(1, Math.ceil(total / normalized.pageSize))
      const page = total === 0 ? 1 : Math.min(normalized.page, totalPages)
      const offset = (page - 1) * normalized.pageSize

      const listParams = [...params, normalized.pageSize, offset]
      const { rows } = await pool.query<{ payload: Recipe }>(
        `SELECT payload FROM recipes ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        listParams,
      )

      return {
        items: rows.map((row) => row.payload),
        total,
        page,
        pageSize: normalized.pageSize,
        totalPages,
      }
    },

    async getRecipeStats(): Promise<RecipeStats> {
      const { rows } = await pool.query<{
        total: string
        active: string
        archived: string
        favorites: string
      }>(
        `SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE payload->>'status' = 'Ativa')::text AS active,
          COUNT(*) FILTER (WHERE payload->>'status' = 'Arquivada')::text AS archived,
          COUNT(*) FILTER (WHERE COALESCE((payload->>'isFavorite')::boolean, false) = true)::text AS favorites
         FROM recipes`,
      )
      const row = rows[0]
      return {
        total: Number(row?.total ?? 0),
        active: Number(row?.active ?? 0),
        archived: Number(row?.archived ?? 0),
        favorites: Number(row?.favorites ?? 0),
      }
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

    async countProducts() {
      const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM products')
      return Number(rows[0]?.count ?? 0)
    },

    async loadAllProducts() {
      const { rows } = await pool.query<{ payload: CatalogProduct }>('SELECT payload FROM products')
      return rows.map((row) => row.payload)
    },

    async loadProductRecord(id) {
      const { rows } = await pool.query<{ payload: CatalogProduct }>(
        'SELECT payload FROM products WHERE id = $1',
        [id],
      )
      return rows[0]?.payload ?? null
    },

    async saveProductRecord(product) {
      await pool.query(
        `INSERT INTO products (id, name_key, payload) VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (id) DO UPDATE SET name_key = EXCLUDED.name_key, payload = EXCLUDED.payload`,
        [product.id, product.nameKey, JSON.stringify(product)],
      )
    },

    async deleteProductRecord(id) {
      await pool.query('DELETE FROM products WHERE id = $1', [id])
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

    async loadWasteControlDay(id) {
      const { rows } = await pool.query<{ payload: WasteControlDay }>(
        'SELECT payload FROM waste_control_days WHERE id = $1',
        [id],
      )
      return rows[0]?.payload ?? null
    },

    async loadWasteControlDayByDateAndSector(operationalDate, sector) {
      const { rows } = await pool.query<{ payload: WasteControlDay }>(
        `SELECT payload FROM waste_control_days
         WHERE record_date = $1::date AND sector = $2
         LIMIT 1`,
        [operationalDate, sector],
      )
      return rows[0]?.payload ?? null
    },

    async loadWasteControlDaysInMonth(year, month) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`
      const endMonth = month === 12 ? 1 : month + 1
      const endYear = month === 12 ? year + 1 : year
      const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`
      const { rows } = await pool.query<{ payload: WasteControlDay }>(
        `SELECT payload FROM waste_control_days
         WHERE record_date >= $1::date AND record_date < $2::date
         ORDER BY record_date ASC`,
        [start, end],
      )
      return rows.map((row) => row.payload)
    },

    async saveWasteControlDay(day) {
      const operationalDate = day.operationalDate || day.date
      try {
        await pool.query(
          `INSERT INTO waste_control_days (id, record_date, buffet, sector, payload)
           VALUES ($1, $2::date, $3, $4, $5::jsonb)
           ON CONFLICT (id) DO UPDATE SET
             record_date = EXCLUDED.record_date,
             buffet = EXCLUDED.buffet,
             sector = EXCLUDED.sector,
             payload = EXCLUDED.payload`,
          [day.id, operationalDate, day.buffet, day.sector ?? null, JSON.stringify(day)],
        )
      } catch (error) {
        if (
          isPostgresUniqueViolation(error, 'idx_waste_control_days_date_sector') &&
          (day.sector === 'CONFEITARIA' || day.sector === 'PADARIA')
        ) {
          throw new WasteControlUniqueConflictError(operationalDate, day.sector)
        }
        throw error
      }
    },

    async loadAllRequisitions() {
      const { rows } = await pool.query(
        `SELECT payload
         FROM requisitions
         ORDER BY created_at DESC`,
      )

      return rows.map(
        (row) =>
          row.payload as Parameters<DatabaseStore['saveRequisition']>[0],
      )
    },

    async loadRequisition(id) {
      const { rows } = await pool.query(
        'SELECT payload FROM requisitions WHERE id = $1',
        [id],
      )

      return (
        (rows[0]?.payload as
          | Parameters<DatabaseStore['saveRequisition']>[0]
          | undefined) ?? null
      )
    },

    async saveRequisition(record) {
      await pool.query(
        `INSERT INTO requisitions (
           id,
           status,
           created_at,
           updated_at,
           payload
         )
         VALUES ($1, $2, $3::timestamptz, $4::timestamptz, $5::jsonb)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           updated_at = EXCLUDED.updated_at,
           payload = EXCLUDED.payload`,
        [
          record.id,
          record.status,
          record.createdAt,
          record.updatedAt,
          JSON.stringify(record),
        ],
      )
    },
    async loadLabelRecord(id) {
      const { rows } = await pool.query<{ payload: import('../types.js').LabelRecord }>(
        'SELECT payload FROM label_records WHERE id = $1',
        [id],
      )
      return rows[0]?.payload ?? null
    },

    async loadAllLabelRecords() {
      const { rows } = await pool.query<{ payload: import('../types.js').LabelRecord }>(
        'SELECT payload FROM label_records ORDER BY printed_at DESC',
      )
      return rows.map((row) => row.payload)
    },

    async saveLabelRecord(record) {
      await pool.query(
        `INSERT INTO label_records (id, printed_at, payload) VALUES ($1, $2::timestamptz, $3::jsonb)
         ON CONFLICT (id) DO UPDATE SET printed_at = EXCLUDED.printed_at, payload = EXCLUDED.payload`,
        [record.id, record.printedAt, JSON.stringify(record)],
      )
    },

    async loadIntelligenceSnapshot(id) {
      const { rows } = await pool.query<{ payload: unknown }>(
        'SELECT payload FROM intelligence_snapshots WHERE id = $1',
        [id],
      )
      const snapshot = rows[0]?.payload as import('../intelligence/types.js').IntelligenceSnapshot | undefined
      return snapshot ?? null
    },

    async loadIntelligenceSnapshotsByPeriod(year, month, category) {
      const params: Array<string | number> = [year, month]
      let sql = `SELECT payload FROM intelligence_snapshots
         WHERE period_year = $1 AND period_month = $2`
      if (category) {
        sql += ' AND category = $3'
        params.push(category)
      }
      sql += ' ORDER BY generated_at DESC'
      const { rows } = await pool.query<{ payload: unknown }>(sql, params)
      return rows.map((row) => row.payload as import('../intelligence/types.js').IntelligenceSnapshot)
    },

    async saveIntelligenceSnapshot(snapshot) {
      await pool.query(
        `INSERT INTO intelligence_snapshots (id, category, period_year, period_month, payload, generated_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::timestamptz)
         ON CONFLICT (id) DO UPDATE SET
           category = EXCLUDED.category,
           period_year = EXCLUDED.period_year,
           period_month = EXCLUDED.period_month,
           payload = EXCLUDED.payload,
           generated_at = EXCLUDED.generated_at`,
        [
          snapshot.id,
          snapshot.category,
          snapshot.period.year,
          snapshot.period.month,
          JSON.stringify(snapshot),
          snapshot.generatedAt,
        ],
      )
    },

    async deleteIntelligenceSnapshotsByPeriod(year, month, category) {
      if (category) {
        await pool.query(
          'DELETE FROM intelligence_snapshots WHERE period_year = $1 AND period_month = $2 AND category = $3',
          [year, month, category],
        )
        return
      }

      await pool.query(
        'DELETE FROM intelligence_snapshots WHERE period_year = $1 AND period_month = $2',
        [year, month],
      )
    },

    async insertAuditLog(record) {
      await pool.query(
        `INSERT INTO audit_logs (
          id, actor_id, actor_name, actor_email, actor_employee_id,
          entity_type, entity_id, action, summary, before_data, after_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          record.id,
          record.actor.userId,
          record.actor.userName,
          record.actor.userEmail,
          record.actor.employeeId ?? null,
          record.entityType,
          record.entityId,
          record.action,
          record.summary,
          record.before ? JSON.stringify(record.before) : null,
          record.after ? JSON.stringify(record.after) : null,
          record.createdAt,
        ],
      )
    },

    async listAuditLogs(filters) {
      const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200)
      const offset = Math.max(filters.offset ?? 0, 0)
      const conditions: string[] = []
      const params: unknown[] = []

      const add = (sql: string, value: unknown) => {
        params.push(value)
        conditions.push(sql.replace('$?', `$${params.length}`))
      }

      if (filters.entityType) add('entity_type = $?', filters.entityType)
      if (filters.entityId) add('entity_id = $?', filters.entityId)
      if (filters.actorId) add('actor_id = $?', filters.actorId)
      if (filters.action) add('action = $?', filters.action)
      if (filters.from) add('created_at >= $?::timestamptz', filters.from)
      if (filters.to) add('created_at <= $?::timestamptz', filters.to)

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM audit_logs ${where}`,
        params,
      )
      const total = Number(countResult.rows[0]?.count ?? 0)

      const listParams = [...params, limit, offset]
      const result = await pool.query<{
        id: string
        actor_id: string
        actor_name: string
        actor_email: string
        actor_employee_id: string | null
        entity_type: string
        entity_id: string
        action: string
        summary: string
        before_data: unknown
        after_data: unknown
        created_at: Date
      }>(
        `SELECT id, actor_id, actor_name, actor_email, actor_employee_id,
                entity_type, entity_id, action, summary, before_data, after_data, created_at
         FROM audit_logs ${where}
         ORDER BY created_at DESC
         LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
        listParams,
      )

      return {
        total,
        items: result.rows.map((row) => ({
          id: row.id,
          actor: {
            userId: row.actor_id,
            userName: row.actor_name,
            userEmail: row.actor_email,
            employeeId: row.actor_employee_id ?? undefined,
          },
          entityType: row.entity_type as import('../audit/types.js').AuditEntityType,
          entityId: row.entity_id,
          action: row.action as import('../audit/types.js').AuditAction,
          summary: row.summary,
          before: row.before_data as Record<string, unknown> | null,
          after: row.after_data as Record<string, unknown> | null,
          createdAt: row.created_at.toISOString(),
        })),
      }
    },
  }
}
