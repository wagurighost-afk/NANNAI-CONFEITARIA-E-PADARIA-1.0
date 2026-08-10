/**
 * Legado documental dos 14 IDs fixos do modelo antigo.
 * NÃO usar para rollover/materialização — cada ProductionDay deve ter ID novo.
 * Mantido para referência de migração e mocks de frontend.
 */
export const ACTIVE_PRODUCTION_IDS: Record<string, { id: string; code: string }> = {
  'emp-mauro': { id: 'prd-mauro', code: 'PRD-000001' },
  'emp-larissa': { id: 'prd-larissa', code: 'PRD-000002' },
  'emp-helena': { id: 'prd-helena', code: 'PRD-000003' },
  'emp-matheus': { id: 'prd-matheus', code: 'PRD-000004' },
  'emp-hosana': { id: 'prd-hosana', code: 'PRD-000005' },
  'emp-rafaela': { id: 'prd-rafaela', code: 'PRD-000006' },
  'emp-thayse': { id: 'prd-thayse', code: 'PRD-000007' },
  'emp-adriana': { id: 'prd-adriana', code: 'PRD-000008' },
  'emp-silvana': { id: 'prd-silvana', code: 'PRD-000009' },
  'emp-williamys': { id: 'prd-williamys', code: 'PRD-000010' },
  'emp-luciano': { id: 'prd-luciano', code: 'PRD-000011' },
  'emp-paulo': { id: 'prd-paulo', code: 'PRD-000012' },
  'emp-romario': { id: 'prd-romario', code: 'PRD-000013' },
  'emp-vinicius': { id: 'prd-vinicius', code: 'PRD-000014' },
}

export const SKIPPED_PRODUCTION_EMPLOYEE_IDS = new Set(['emp-david', 'emp-elenilson'])
