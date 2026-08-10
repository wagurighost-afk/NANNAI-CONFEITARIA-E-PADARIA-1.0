/**
 * Modelo padrão de produção (template) — NÃO é histórico.
 * Fonte atual: PRODUCTION_DIVISION (catálogo operacional).
 * Overrides em memória permitem Test F / evolução futura sem reescrever dias passados.
 */
import {
  PRODUCTION_DIVISION,
  type ProductionDivisionEntry,
} from './productionDivision.js'
import { SKIPPED_PRODUCTION_EMPLOYEE_IDS } from './activeProduction.js'

export interface ProductionTemplateItem {
  name: string
  recipeId?: string
}

export interface ProductionTemplate {
  employeeId: string
  employeeName: string
  sector: ProductionDivisionEntry['sector']
  shift: ProductionDivisionEntry['shift']
  items: ProductionTemplateItem[]
  notes?: string
  /** ISO timestamp da última alteração do modelo (não do ProductionDay). */
  updatedAt: string
}

const templateOverrides = new Map<string, ProductionTemplate>()

export function divisionEntryToTemplate(entry: ProductionDivisionEntry): ProductionTemplate {
  return {
    employeeId: entry.employeeId,
    employeeName: entry.employeeName,
    sector: entry.sector,
    shift: entry.shift,
    items: entry.products.map((name) => ({ name })),
    ...(entry.notes ? { notes: entry.notes } : {}),
    updatedAt: '1970-01-01T00:00:00.000Z',
  }
}

/** Templates válidos: ativos na divisão, com ao menos 1 tarefa, não skipped. */
export function listProductionTemplates(): ProductionTemplate[] {
  const byEmployee = new Map<string, ProductionTemplate>()

  for (const entry of PRODUCTION_DIVISION) {
    if (SKIPPED_PRODUCTION_EMPLOYEE_IDS.has(entry.employeeId)) {
      continue
    }
    if (!entry.products.length) {
      continue
    }
    byEmployee.set(entry.employeeId, divisionEntryToTemplate(entry))
  }

  for (const [employeeId, template] of templateOverrides) {
    if (!template.items.length) {
      byEmployee.delete(employeeId)
      continue
    }
    byEmployee.set(employeeId, template)
  }

  return [...byEmployee.values()]
}

export function getProductionTemplate(employeeId: string): ProductionTemplate | null {
  return listProductionTemplates().find((item) => item.employeeId === employeeId) ?? null
}

/**
 * Atualiza o modelo padrão do colaborador.
 * Não altera ProductionDay já materializados.
 */
export function setProductionTemplate(template: ProductionTemplate): ProductionTemplate {
  const normalized: ProductionTemplate = {
    ...template,
    items: template.items
      .map((item) => ({
        name: item.name.trim(),
        ...(item.recipeId?.trim() ? { recipeId: item.recipeId.trim() } : {}),
      }))
      .filter((item) => item.name.length > 0),
    updatedAt: new Date().toISOString(),
  }
  if (normalized.items.length === 0) {
    throw new Error('Modelo de produção precisa de ao menos uma tarefa.')
  }
  templateOverrides.set(normalized.employeeId, normalized)
  return normalized
}

/** Apenas testes / migração controlada. */
export function clearProductionTemplateOverrides(): void {
  templateOverrides.clear()
}
