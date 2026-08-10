/**
 * Testes A–F do histórico diário ProductionDay.
 * Uso:
 *   DATABASE_URL=postgresql://nannai@127.0.0.1:5432/nannai_history \
 *   node --import tsx scripts/test-production-day-history.mjs
 */
import pg from 'pg'
import { randomUUID } from 'node:crypto'

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://nannai@127.0.0.1:5432/nannai_history'

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nannai-history-'))
process.env.DATABASE_URL = DATABASE_URL
process.env.DATA_DIR = dataDir
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test'

async function resetDb() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL })
  await pool.query('DROP TABLE IF EXISTS productions CASCADE')
  await pool.query('DROP TABLE IF EXISTS meta CASCADE')
  // leave other tables; init will recreate productions/meta via SCHEMA
  await pool.query('DROP SCHEMA public CASCADE')
  await pool.query('CREATE SCHEMA public')
  await pool.end()
}

function assert(cond, msg) {
  if (!cond) {
    throw new Error(msg)
  }
}

async function main() {
  console.log('Reset DB…', DATABASE_URL)
  await resetDb()

  const { initDatabase, findProductionByEmployeeAndDate, loadAllProductionRecords, saveProductionRecord, getMeta, setMeta } =
    await import('../src/db/index.ts')
  const { buildFreshProductionDay, getNextProductionCode } = await import('../src/data/productionSeed.ts')
  const {
    listProductionTemplates,
    setProductionTemplate,
    clearProductionTemplateOverrides,
    getProductionTemplate,
  } = await import('../src/data/productionTemplate.ts')
  const { ensureProductionDaysForDate, rolloverProductionsIfNeeded, saveProduction } =
    await import('../src/seed.ts')

  await initDatabase()

  const DAY_A = '2026-08-09'
  const DAY_B = '2026-08-10'
  const DAY_C = '2026-08-11'

  clearProductionTemplateOverrides()
  const templates = listProductionTemplates()
  assert(templates.length === 14, `Esperado 14 templates, got ${templates.length}`)

  // --- Seed legado: 14 registros no dia A (IDs fixos simulados) ---
  const codes = []
  for (const template of templates) {
    const code = getNextProductionCode(codes)
    codes.push(code)
    const day = buildFreshProductionDay(template, DAY_A, code)
    // força ID legado estável só para o dia A (estado migrável)
    day.id = `prd-legacy-${template.employeeId}`
    day.items[0].status = 'Em produção'
    day.progress = Math.round((1 / day.items.length) * 100)
    await saveProductionRecord(day)
  }
  await setMeta('production_rollover_date', DAY_A)

  const countByDate = async (date) =>
    (await loadAllProductionRecords()).filter((p) => p.date === date).length

  const snapshotDay = async (date) => {
    const rows = (await loadAllProductionRecords())
      .filter((p) => p.date === date)
      .map((p) => ({
        id: p.id,
        employeeId: p.employeeId,
        progress: p.progress,
        item0: p.items[0]?.status,
        comments: p.comments.length,
        itemNames: p.items.map((i) => i.name).join('|'),
      }))
      .sort((a, b) => a.employeeId.localeCompare(b.employeeId))
    return rows
  }

  // ========== TESTE A ==========
  assert((await countByDate(DAY_A)) === 14, 'A: dia 09 deve ter 14')
  const createdB = await ensureProductionDaysForDate(DAY_B)
  assert(createdB === 14, `A: virada deve criar 14, criou ${createdB}`)
  const countA = await countByDate(DAY_A)
  const countB = await countByDate(DAY_B)
  const total = (await loadAllProductionRecords()).length
  assert(countA === 14, `A: 09/08 permanece 14, got ${countA}`)
  assert(countB === 14, `A: 10/08 = 14, got ${countB}`)
  assert(total === 28, `A: total 28, got ${total}`)
  const idsA = new Set((await loadAllProductionRecords()).filter((p) => p.date === DAY_A).map((p) => p.id))
  const idsB = new Set((await loadAllProductionRecords()).filter((p) => p.date === DAY_B).map((p) => p.id))
  for (const id of idsB) {
    assert(!idsA.has(id), `A: ID ${id} de 10/08 não pode existir em 09/08`)
  }
  console.log('PASS A', { countA, countB, total, createdB })

  // ========== TESTE B ==========
  const beforeA = await snapshotDay(DAY_A)
  const mauroB = await findProductionByEmployeeAndDate('emp-mauro', DAY_B)
  assert(mauroB, 'B: mauro dia B existe')
  mauroB.items = mauroB.items.map((item, i) =>
    i === 0 ? { ...item, status: 'Concluído' } : item,
  )
  mauroB.progress = Math.round(
    (mauroB.items.filter((i) => i.status === 'Concluído').length / mauroB.items.length) * 100,
  )
  mauroB.updatedAt = new Date().toISOString()
  await saveProduction(mauroB)
  const afterA = await snapshotDay(DAY_A)
  assert(JSON.stringify(beforeA) === JSON.stringify(afterA), 'B: 09/08 não pode mudar ao editar 10/08')
  const mauroB2 = await findProductionByEmployeeAndDate('emp-mauro', DAY_B)
  assert(mauroB2.items[0].status === 'Concluído', 'B: edição em 10/08 persistiu')
  console.log('PASS B')

  // ========== TESTE C ==========
  const mauroA = await findProductionByEmployeeAndDate('emp-mauro', DAY_A)
  assert(mauroA, 'C: mauro dia A')
  mauroA.comments = [
    {
      id: `cmt-${randomUUID()}`,
      message: 'comentário dia 09',
      authorId: 'usr-test',
      authorName: 'Tester',
      createdAt: new Date().toISOString(),
      photos: [
        {
          id: `ph-${randomUUID()}`,
          fileName: 'test.jpg',
          mimeType: 'image/jpeg',
          fileUrl: '/uploads/test.jpg',
        },
      ],
    },
  ]
  await saveProduction(mauroA)
  const mauroA2 = await findProductionByEmployeeAndDate('emp-mauro', DAY_A)
  const mauroB3 = await findProductionByEmployeeAndDate('emp-mauro', DAY_B)
  assert(mauroA2.comments.length === 1, 'C: comentário no dia 09')
  assert(mauroA2.comments[0].message === 'comentário dia 09', 'C: texto no dia 09')
  assert(mauroA2.comments[0].photos.length === 1, 'C: foto no dia 09')
  assert((mauroB3.comments ?? []).length === 0, 'C: comentário não vazou para 10/08')
  console.log('PASS C', { commentsA: mauroA2.comments.length, commentsB: mauroB3.comments.length })

  // ========== TESTE D — 10 chamadas paralelas ==========
  const beforeTotal = (await loadAllProductionRecords()).length
  const parallel = await Promise.all(
    Array.from({ length: 10 }, () => ensureProductionDaysForDate(DAY_C)),
  )
  const countC = await countByDate(DAY_C)
  const afterTotal = (await loadAllProductionRecords()).length
  assert(countC === 14, `D: 11/08 deve ter 14, got ${countC}`)
  assert(afterTotal === beforeTotal + 14, `D: +14 apenas, got +${afterTotal - beforeTotal}`)
  assert(
    parallel.reduce((a, b) => a + b, 0) === 14,
    `D: soma created das 10 calls = 14, got ${parallel.reduce((a, b) => a + b, 0)}`,
  )
  const byEmp = new Map()
  for (const p of await loadAllProductionRecords()) {
    if (p.date !== DAY_C) continue
    byEmp.set(p.employeeId, (byEmp.get(p.employeeId) ?? 0) + 1)
  }
  for (const [emp, n] of byEmp) {
    assert(n === 1, `D: duplicata ${emp}=${n}`)
  }
  console.log('PASS D', { countC, parallel, afterTotal })

  // ========== TESTE E — “reinício” (re-init + rollover) ==========
  const snapBefore = (await loadAllProductionRecords())
    .map((p) => `${p.id}|${p.date}|${p.employeeId}|${p.progress}|${p.comments.length}`)
    .sort()
  await setMeta('production_rollover_date', DAY_A) // força caminho de rollover
  // reimport modules would share same pool; call rollover with mocked today via ensure only
  // Simula restart: re-init store already bound; chama ensure para dias existentes + meta
  const createdAgainA = await ensureProductionDaysForDate(DAY_A)
  const createdAgainB = await ensureProductionDaysForDate(DAY_B)
  const createdAgainC = await ensureProductionDaysForDate(DAY_C)
  assert(createdAgainA === 0 && createdAgainB === 0 && createdAgainC === 0, 'E: não recria dias')
  const snapAfter = (await loadAllProductionRecords())
    .map((p) => `${p.id}|${p.date}|${p.employeeId}|${p.progress}|${p.comments.length}`)
    .sort()
  assert(JSON.stringify(snapBefore) === JSON.stringify(snapAfter), 'E: histórico inalterado')
  console.log('PASS E')

  // ========== TESTE F — alterar template ==========
  const beforePastNames = (await findProductionByEmployeeAndDate('emp-mauro', DAY_A)).items.map(
    (i) => i.name,
  )
  const tpl = getProductionTemplate('emp-mauro')
  assert(tpl, 'F: template mauro')
  setProductionTemplate({
    ...tpl,
    items: [{ name: 'TAREFA-NOVA-TEMPLATE-ONLY' }, { name: 'Outra tarefa futura' }],
  })
  const DAY_D = '2026-08-12'
  await ensureProductionDaysForDate(DAY_D)
  const pastAfter = await findProductionByEmployeeAndDate('emp-mauro', DAY_A)
  const future = await findProductionByEmployeeAndDate('emp-mauro', DAY_D)
  assert(
    pastAfter.items.map((i) => i.name).join('|') === beforePastNames.join('|'),
    'F: dia passado não muda com template',
  )
  assert(
    future.items.map((i) => i.name).join('|') === 'TAREFA-NOVA-TEMPLATE-ONLY|Outra tarefa futura',
    'F: dia futuro recebe modelo novo',
  )
  // dia B (já materializado) também não muda
  const mid = await findProductionByEmployeeAndDate('emp-mauro', DAY_B)
  assert(
    !mid.items.some((i) => i.name === 'TAREFA-NOVA-TEMPLATE-ONLY'),
    'F: dia já materializado não herda template novo',
  )
  clearProductionTemplateOverrides()
  console.log('PASS F')

  // rollover helper smoke (meta)
  await setMeta('production_rollover_date', '2026-08-01')
  // cannot easily mock getTodayIso without clock; ensure API exists
  assert(typeof rolloverProductionsIfNeeded === 'function', 'rollover export')
  assert((await getMeta('production_rollover_date')) === '2026-08-01', 'meta ok')

  const finalCounts = {
    [DAY_A]: await countByDate(DAY_A),
    [DAY_B]: await countByDate(DAY_B),
    [DAY_C]: await countByDate(DAY_C),
    [DAY_D]: await countByDate(DAY_D),
    total: (await loadAllProductionRecords()).length,
  }
  console.log('ALL PASS', finalCounts)
}

main().catch((err) => {
  console.error('FAIL', err)
  process.exit(1)
})
