/**
 * Registro seguro de auditoria — não interrompe a operação principal.
 * @module audit/safeAudit
 */

import { recordAuditLog, type RecordAuditInput } from './audit.service.js'
import type { AuditActor } from './types.js'

export async function safeAudit(
  actor: AuditActor | undefined,
  input: Omit<RecordAuditInput, 'actor'>,
): Promise<void> {
  if (!actor) {
    return
  }

  try {
    await recordAuditLog({ ...input, actor })
  } catch (error) {
    console.error('[audit] Falha ao registrar log:', error)
  }
}
