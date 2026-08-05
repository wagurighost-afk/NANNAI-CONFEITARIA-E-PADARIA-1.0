/**
 * Serviço reutilizável de atribuição de responsáveis.
 * Usa Escala Mensal + Escala Diária — nunca libera folga/férias/licença/afastados.
 */
import type {
  AssignableEmployee,
  AssignmentSector,
  ListAssignableInput,
} from '@/features/assignment/types/assignment.types'
import {
  dailyStatusToPresence,
  isPresenceSelectable,
  mergePresence,
  monthlyStatusToPresence,
} from '@/features/assignment/utils/presence'
import { ASSIGNMENT_SECTOR_LABELS } from '@/features/assignment/constants/assignment.constants'

const CONFEITARIA_POSITIONS = new Set([
  'Chef de Confeitaria',
  'Chef Executivo',
  'Confeiteiro',
  'Auxiliar de Confeitaria',
  'Diretor de Operação',
  'Gerente Geral',
  // cargos da planilha de escala
  'PASTELEIRA',
  'PASTELEIRO',
  'AUX. PASTELARIA',
  'AUX PASTELARIA',
])

const PADARIA_POSITIONS = new Set([
  'Padeiro',
  'Auxiliar de Padaria',
  'Chef Executivo',
  'Chef de Confeitaria',
  'Diretor de Operação',
  'Gerente Geral',
  // cargos da planilha de escala
  'PADEIRO',
  'AUX. DE PADARIA',
  'AUX DE PADARIA',
  'AUX. PADARIA',
])

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function normalizePositionKey(position: string): string {
  return stripDiacritics(position)
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isConfeitariaPosition(position: string): boolean {
  const key = normalizePositionKey(position)
  if (CONFEITARIA_POSITIONS.has(position) || CONFEITARIA_POSITIONS.has(position.toUpperCase())) {
    return true
  }
  return (
    key.includes('confeit') ||
    key.includes('pastel') ||
    key.includes('chef executivo') ||
    key.includes('diretor de operacao') ||
    key.includes('gerente geral')
  )
}

function isPadariaPosition(position: string): boolean {
  const key = normalizePositionKey(position)
  if (PADARIA_POSITIONS.has(position) || PADARIA_POSITIONS.has(position.toUpperCase())) {
    return true
  }
  return key.includes('padari') || key.includes('padeiro')
}

function inferSectorFromPosition(position: string, fallback = 'Confeitaria'): string {
  if (isPadariaPosition(position) && !isConfeitariaPosition(position)) {
    return 'Padaria'
  }
  if (isConfeitariaPosition(position)) {
    return 'Confeitaria'
  }
  return fallback
}

function matchesSector(
  sector: AssignmentSector,
  employeeSector: string,
  position: string,
  shiftLabel: string,
): boolean {
  const shift = stripDiacritics(shiftLabel)
  const sectorKey = stripDiacritics(employeeSector)

  if (sector === 'confeitaria') {
    return sectorKey.includes('confeit') || isConfeitariaPosition(position)
  }
  if (sector === 'padaria') {
    return sectorKey.includes('padari') || isPadariaPosition(position)
  }

  // Buffets: aceita confeitaria/padaria; prioriza turno compatível (soft — não exclui demais).
  const operational =
    sectorKey.includes('confeit') ||
    sectorKey.includes('padari') ||
    isConfeitariaPosition(position) ||
    isPadariaPosition(position)

  if (!operational) {
    return false
  }

  if (sector === 'cafe') {
    // Exclui só quem é claramente madrugada pura (sem manhã/07h).
    const isOvernight =
      shift.includes('madrugada') ||
      shift.includes('23:') ||
      shift.includes('22:') ||
      shift.includes('00:')
    const coversMorning =
      shift.includes('manha') ||
      shift.includes('integral') ||
      shift.includes('07') ||
      shift.includes('08') ||
      shift.includes('09')
    return !isOvernight || coversMorning
  }
  if (sector === 'cha') {
    return true
  }
  if (sector === 'jantar') {
    return (
      shift.includes('tarde') ||
      shift.includes('integral') ||
      shift.includes('15') ||
      shift.includes('16') ||
      shift.includes('jantar') ||
      !shift.includes('madrugada')
    )
  }
  return operational
}

function resolveEmployeeId(
  employeeId: string | null | undefined,
  employeeName: string,
): string {
  if (employeeId && employeeId.trim()) {
    return employeeId
  }
  return `name:${stripDiacritics(employeeName).replace(/\s+/g, '-')}`
}

export const AssignmentService = {
  sectorLabel(sector: AssignmentSector): string {
    return ASSIGNMENT_SECTOR_LABELS[sector]
  },

  /**
   * Lista colaboradores aptos para atribuição no setor/data.
   * Apenas `presence === 'present'` ficam com `selectable: true`.
   */
  listCandidates(input: ListAssignableInput): AssignableEmployee[] {
    const employeeById = new Map(input.employees.map((employee) => [employee.id, employee]))
    const employeeByName = new Map(
      input.employees.map((employee) => [stripDiacritics(employee.name), employee]),
    )
    const dailyById = new Map(input.dailyEntries.map((entry) => [entry.employeeId, entry]))
    const dailyByName = new Map(
      input.dailyEntries.map((entry) => [stripDiacritics(entry.employeeName), entry]),
    )

    const seenIds = new Set<string>()
    const seenNames = new Set<string>()
    const result: AssignableEmployee[] = []

    for (const row of input.monthlyRows) {
      const nameKey = stripDiacritics(row.employeeName)
      if (seenNames.has(nameKey)) {
        continue
      }

      const byName = employeeByName.get(nameKey)
      const byId = row.employeeId ? employeeById.get(row.employeeId) : undefined
      // Só confia no employeeId da escala quando o nome bate — evita IDs duplicados/errados.
      const idMatchesName = Boolean(byId && stripDiacritics(byId.name) === nameKey)
      const catalog = byName ?? (idMatchesName ? byId : undefined)
      const employeeId =
        catalog?.id ??
        resolveEmployeeId(idMatchesName ? row.employeeId : null, row.employeeName)

      if (seenIds.has(employeeId)) {
        continue
      }

      const daily =
        dailyByName.get(nameKey) ??
        (catalog ? dailyById.get(catalog.id) : undefined) ??
        (idMatchesName && row.employeeId ? dailyById.get(row.employeeId) : undefined) ??
        null

      const monthlyPresence = monthlyStatusToPresence(row.dayStatus)
      const dailyPresence = daily
        ? dailyStatusToPresence(daily.status, daily.notes)
        : null
      const presence = mergePresence(monthlyPresence, dailyPresence)

      // Cargo/turno da escala mensal do dia são a fonte operacional.
      const position = row.position || catalog?.position || 'Colaborador'
      const sector = catalog?.sector ?? inferSectorFromPosition(position)
      const shift = row.shift || daily?.shift || catalog?.shift || '—'

      if (!matchesSector(input.sector, sector, position, shift)) {
        continue
      }

      seenIds.add(employeeId)
      seenNames.add(nameKey)
      result.push({
        employeeId,
        name: catalog?.name ?? row.employeeName,
        position,
        shift,
        ...(row.shiftCode ? { shiftCode: row.shiftCode } : {}),
        ...(catalog?.photoUrl ? { photoUrl: catalog.photoUrl } : {}),
        sectorLabel: sector,
        presence,
        selectable: isPresenceSelectable(presence),
        source: daily ? 'both' : 'monthly',
      })
    }

    // Inclui quem está só na escala diária (sem linha mensal resolvida).
    for (const entry of input.dailyEntries) {
      const nameKey = stripDiacritics(entry.employeeName)
      if (seenIds.has(entry.employeeId) || seenNames.has(nameKey)) {
        continue
      }
      const catalog = employeeById.get(entry.employeeId) ?? employeeByName.get(nameKey)
      const presence = mergePresence(null, dailyStatusToPresence(entry.status, entry.notes))
      const position = catalog?.position ?? 'Colaborador'
      const sector = catalog?.sector ?? entry.sector
      if (!matchesSector(input.sector, sector, position, entry.shift)) {
        continue
      }
      seenIds.add(entry.employeeId)
      seenNames.add(nameKey)
      result.push({
        employeeId: entry.employeeId,
        name: catalog?.name ?? entry.employeeName,
        position,
        shift: entry.shift,
        ...(catalog?.photoUrl ? { photoUrl: catalog.photoUrl } : {}),
        sectorLabel: sector,
        presence,
        selectable: isPresenceSelectable(presence),
        source: 'daily',
      })
    }

    return result.sort((a, b) => {
      if (a.selectable !== b.selectable) {
        return a.selectable ? -1 : 1
      }
      return a.name.localeCompare(b.name, 'pt-BR')
    })
  },

  listSelectable(input: ListAssignableInput): AssignableEmployee[] {
    return this.listCandidates(input).filter((item) => item.selectable)
  },

  assertSelectable(candidates: AssignableEmployee[], employeeId: string): AssignableEmployee {
    const found = candidates.find((item) => item.employeeId === employeeId && item.selectable)
    if (!found) {
      throw new Error('Colaborador indisponível para atribuição neste dia/setor.')
    }
    return found
  },
}
