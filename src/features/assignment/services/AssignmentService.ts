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
])

const PADARIA_POSITIONS = new Set([
  'Padeiro',
  'Auxiliar de Padaria',
  'Chef Executivo',
  'Chef de Confeitaria',
  'Diretor de Operação',
  'Gerente Geral',
])

function matchesSector(
  sector: AssignmentSector,
  employeeSector: string,
  position: string,
  shiftLabel: string,
): boolean {
  const shift = shiftLabel.toLowerCase()

  if (sector === 'confeitaria') {
    return employeeSector === 'Confeitaria' || CONFEITARIA_POSITIONS.has(position)
  }
  if (sector === 'padaria') {
    return employeeSector === 'Padaria' || PADARIA_POSITIONS.has(position)
  }

  // Buffets: aceita confeitaria/padaria; prioriza turno compatível (soft — não exclui).
  const operational =
    employeeSector === 'Confeitaria' ||
    employeeSector === 'Padaria' ||
    CONFEITARIA_POSITIONS.has(position) ||
    PADARIA_POSITIONS.has(position)

  if (!operational) {
    return false
  }

  if (sector === 'cafe') {
    return !shift.includes('madrugada') || shift.includes('manhã') || shift.includes('integral') || shift.includes('07')
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

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
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

    const seen = new Set<string>()
    const result: AssignableEmployee[] = []

    for (const row of input.monthlyRows) {
      const catalog =
        (row.employeeId ? employeeById.get(row.employeeId) : undefined) ??
        employeeByName.get(stripDiacritics(row.employeeName))

      const employeeId = catalog?.id ?? row.employeeId
      if (!employeeId || seen.has(employeeId)) {
        continue
      }

      const daily = dailyById.get(employeeId)
      const monthlyPresence = monthlyStatusToPresence(row.dayStatus)
      const dailyPresence = daily
        ? dailyStatusToPresence(daily.status, daily.notes)
        : null
      const presence = mergePresence(monthlyPresence, dailyPresence)

      const position = catalog?.position ?? row.position
      const sector = catalog?.sector ?? 'Confeitaria'
      const shift = daily?.shift ?? catalog?.shift ?? row.shift

      if (!matchesSector(input.sector, sector, position, shift)) {
        continue
      }

      seen.add(employeeId)
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
      if (seen.has(entry.employeeId)) {
        continue
      }
      const catalog = employeeById.get(entry.employeeId)
      const presence = mergePresence(null, dailyStatusToPresence(entry.status, entry.notes))
      const position = catalog?.position ?? 'Colaborador'
      const sector = catalog?.sector ?? entry.sector
      if (!matchesSector(input.sector, sector, position, entry.shift)) {
        continue
      }
      seen.add(entry.employeeId)
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

    const scheduleEmpty = input.monthlyRows.length === 0 && input.dailyEntries.length === 0
    if (scheduleEmpty) {
      for (const employee of input.employees) {
        if (seen.has(employee.id) || employee.status !== 'Ativo') {
          continue
        }
        if (!matchesSector(input.sector, employee.sector, employee.position, employee.shift)) {
          continue
        }
        seen.add(employee.id)
        result.push({
          employeeId: employee.id,
          name: employee.name,
          position: employee.position,
          shift: employee.shift,
          ...(employee.photoUrl ? { photoUrl: employee.photoUrl } : {}),
          sectorLabel: employee.sector,
          presence: 'present',
          selectable: true,
          source: 'catalog',
        })
      }
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
