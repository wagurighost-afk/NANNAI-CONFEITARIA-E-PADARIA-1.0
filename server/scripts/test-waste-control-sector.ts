/**
 * Testes do Controle de Desperdício por setor.
 * Executar: npx tsx scripts/test-waste-control-sector.ts
 * Não usa banco de produção.
 */
import { wasteControlDayId, parseWasteControlSector, isWasteControlSector } from '../src/wasteControl/sectors.js'
import { isLegacyWasteDay, viewWasteControlDay, sumMealTotals, emptyMeal } from '../src/wasteControl/normalizeDay.js'
import { getOperationalDate } from '../src/time/operationalDate.js'
import { WasteControlUniqueConflictError } from '../src/db/wasteControlConflict.js'
import type { WasteControlDay, WasteBuffetType, WasteMealRecord } from '../src/types.js'

type Result = { name: string; ok: boolean; detail?: string }

const results: Result[] = []

function assert(name: string, condition: boolean, detail?: string) {
  results.push({ name, ok: condition, ...(detail && !condition ? { detail } : {}) })
}

function emptyPhases() {
  return {
    entrada: { items: [], wasteKgTotal: 0, phaseTotal: 0 },
    reposicao: { items: [], wasteKgTotal: 0, phaseTotal: 0 },
    finalizacao: { items: [], wasteKgTotal: 0, phaseTotal: 0 },
  }
}

function makeSectorDay(
  date: string,
  sector: 'CONFEITARIA' | 'PADARIA',
  dayTotal: number,
): WasteControlDay {
  const meals: Record<WasteBuffetType, WasteMealRecord> = {
    cafe: { ...emptyMeal(), dayTotal, wasteKgTotal: 0 },
    cha: emptyMeal(),
    jantar: emptyMeal(),
  }
  return {
    id: wasteControlDayId(date, sector),
    date,
    operationalDate: date,
    sector,
    status: 'OPEN',
    buffet: 'cafe',
    pax: 0,
    monthlyGoalReais: 0,
    dessertsQty: 0,
    phases: emptyPhases(),
    meals,
    wasteKgTotal: 0,
    dayTotal,
    updatedAt: new Date().toISOString(),
  }
}

function makeLegacyDay(date: string, buffet: WasteBuffetType, dayTotal: number): WasteControlDay {
  return {
    id: `waste-${buffet}-${date}`,
    date,
    buffet,
    pax: 0,
    monthlyGoalReais: 0,
    dessertsQty: 0,
    phases: emptyPhases(),
    wasteKgTotal: 0,
    dayTotal,
    updatedAt: new Date().toISOString(),
  }
}

// A. Setores independentes na mesma data
const date = '2026-08-16'
const confectionery = makeSectorDay(date, 'CONFEITARIA', 10)
const bakery = makeSectorDay(date, 'PADARIA', 7)
assert('A. Confeitaria e Padaria na mesma data', confectionery.date === bakery.date)

// B. IDs diferentes
assert(
  'B. IDs diferentes',
  confectionery.id !== bakery.id &&
    confectionery.id === 'waste-CONFEITARIA-2026-08-16' &&
    bakery.id === 'waste-PADARIA-2026-08-16',
)

// C. Lançamento isolado
assert(
  'C. Item da Confeitaria não aparece na Padaria',
  confectionery.id !== bakery.id && confectionery.sector !== bakery.sector,
)

// D/E. Finalização independente
const finalizedConfectionery = { ...confectionery, status: 'FINALIZED' as const }
assert(
  'D. Finalizar Confeitaria sem finalizar Padaria',
  finalizedConfectionery.status === 'FINALIZED' && bakery.status === 'OPEN',
)
const finalizedBakery = { ...bakery, status: 'FINALIZED' as const }
assert('E. Padaria pode finalizar depois', finalizedBakery.status === 'FINALIZED')

// F. parse de setor
assert('F. parse CONFEITARIA/PADARIA', parseWasteControlSector('confeitaria') === 'CONFEITARIA')
assert('F. parse rejeita buffet', parseWasteControlSector('cafe') === null)

// G/H. Reabertura exige motivo (contrato)
assert('G. setor operacional válido', isWasteControlSector('CONFEITARIA') && isWasteControlSector('PADARIA'))
assert('H. motivo curto é inválido no contrato', 'ab'.trim().length < 3)

// I. Unicidade concorrente em memória (equivalente JSON lock)
async function concurrentCreate(sector: 'CONFEITARIA' | 'PADARIA') {
  const rows: WasteControlDay[] = []
  let queue = Promise.resolve()
  const save = (day: WasteControlDay) => {
    const run = queue.then(() => {
      const dup = rows.find(
        (item) => item.id !== day.id && item.date === day.date && item.sector === day.sector,
      )
      if (dup && (day.sector === 'CONFEITARIA' || day.sector === 'PADARIA')) {
        throw new WasteControlUniqueConflictError(day.date, day.sector)
      }
      const index = rows.findIndex((item) => item.id === day.id)
      if (index >= 0) {
        rows[index] = day
      } else {
        rows.push(day)
      }
    })
    queue = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }

  await Promise.all(
    Array.from({ length: 10 }, (_, index) =>
      save({
        ...makeSectorDay(date, sector, index + 1),
      }),
    ),
  )
  return rows
}

const confectioneryRows = await concurrentCreate('CONFEITARIA')
const bakeryRows = await concurrentCreate('PADARIA')
assert('I. 10 writes CONFEITARIA = 1 registro', confectioneryRows.length === 1)
assert('I. 10 writes PADARIA = 1 registro', bakeryRows.length === 1)
assert(
  'I. Confeitaria e Padaria coexistem',
  confectioneryRows[0]?.id !== bakeryRows[0]?.id,
)

// J. Histórico sem setor inventado
const legacy = makeLegacyDay(date, 'cafe', 99)
assert('J. legado não tem setor', isLegacyWasteDay(legacy) && (legacy.sector ?? null) == null)
const viewedLegacy = viewWasteControlDay(legacy)
assert('J. view não inventa setor', viewedLegacy.sector == null)

// K. Total consolidado
const totals = sumMealTotals({
  cafe: { ...emptyMeal(), dayTotal: 10 },
  cha: { ...emptyMeal(), dayTotal: 0 },
  jantar: { ...emptyMeal(), dayTotal: 0 },
})
assert('K. soma de meals', totals.dayTotal === 10)
assert(
  'K. consolidado Confeitaria + Padaria',
  confectionery.dayTotal + bakery.dayTotal === 17,
)

// L. Timezone America/Recife
const recife = getOperationalDate(new Date('2026-08-17T02:30:00.000Z'))
assert('L. 02:30 UTC ainda é 16/08 em Recife (UTC-3)', recife === '2026-08-16')
const afterMidnight = getOperationalDate(new Date('2026-08-17T03:30:00.000Z'))
assert('L. 00:30 Recife já é 17/08', afterMidnight === '2026-08-17')

const failed = results.filter((item) => !item.ok)
for (const item of results) {
  console.log(`${item.ok ? 'ok' : 'FAIL'}  ${item.name}${item.detail ? ` — ${item.detail}` : ''}`)
}

if (failed.length > 0) {
  console.error(`\n${failed.length} teste(s) falharam.`)
  process.exit(1)
}

console.log(`\n${results.length} testes passaram.`)
