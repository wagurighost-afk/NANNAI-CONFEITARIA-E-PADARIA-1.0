import { randomUUID } from 'node:crypto'
import { safeAudit } from '../audit/safeAudit.js'
import type { AuditActor } from '../audit/types.js'
import { emitRealtime } from '../events.js'
import { loadAllBugReports, loadBugReportById, saveBugReport } from './bugs.repository.js'
import { resolveBugModuleName } from './bugModules.js'
import type {
  BugListQuery,
  BugListResult,
  BugReport,
  BugStatusHistoryEntry,
  CreateBugInput,
  UpdateBugStatusInput,
} from './types.js'

function notifyBugs(action: string, bugId?: string): void {
  emitRealtime({
    scope: 'bugs',
    action,
    ...(bugId ? { bugId } : {}),
  })
}

function matchesSearch(report: BugReport, search: string): boolean {
  const normalized = search.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  const haystack = [
    report.title,
    report.description,
    report.moduleName,
    report.reportedByName,
    report.reportedByEmail,
    report.os,
    report.browser,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalized)
}

export async function listBugs(query: BugListQuery = {}): Promise<BugListResult> {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 200)
  const offset = Math.max(query.offset ?? 0, 0)

  let items = await loadAllBugReports()

  if (query.status && query.status !== 'all') {
    items = items.filter((item) => item.status === query.status)
  }
  if (query.priority && query.priority !== 'all') {
    items = items.filter((item) => item.priority === query.priority)
  }
  if (query.moduleId && query.moduleId !== 'all') {
    items = items.filter((item) => item.moduleId === query.moduleId)
  }
  if (query.reportedById && query.reportedById !== 'all') {
    items = items.filter((item) => item.reportedById === query.reportedById)
  }
  if (query.search) {
    items = items.filter((item) => matchesSearch(item, query.search!))
  }

  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return {
    total: items.length,
    items: items.slice(offset, offset + limit),
  }
}

export async function getBugById(id: string): Promise<BugReport | null> {
  return loadBugReportById(id)
}

export async function createBug(input: CreateBugInput, actor?: AuditActor): Promise<BugReport> {
  if (!input.title.trim()) {
    throw new Error('Informe um título para o bug.')
  }
  if (!input.description.trim()) {
    throw new Error('Descreva o problema encontrado.')
  }
  if (!input.images || input.images.length === 0) {
    throw new Error('Anexe pelo menos uma imagem do problema.')
  }

  const now = new Date().toISOString()
  const moduleName = input.moduleName || resolveBugModuleName(input.moduleId)

  const report: BugReport = {
    id: `bug-${randomUUID()}`,
    title: input.title.trim(),
    description: input.description.trim(),
    moduleId: input.moduleId,
    moduleName,
    priority: input.priority,
    status: 'aberto',
    images: input.images ?? [],
    ...(input.video ? { video: input.video } : {}),
    os: input.os,
    browser: input.browser,
    appVersion: input.appVersion,
    reportedById: input.reportedById,
    reportedByName: input.reportedByName,
    reportedByEmail: input.reportedByEmail,
    createdAt: now,
    updatedAt: now,
    history: [
      {
        id: `bhist-${randomUUID()}`,
        fromStatus: null,
        toStatus: 'aberto',
        changedById: input.reportedById,
        changedByName: input.reportedByName,
        note: 'Bug reportado',
        changedAt: now,
      },
    ],
  }

  await saveBugReport(report)
  notifyBugs('created', report.id)

  await safeAudit(actor, {
    entityType: 'production',
    entityId: report.id,
    action: 'create',
    summary: `Bug reportado: ${report.title}`,
    after: report,
  })

  return report
}

export async function updateBugStatus(
  id: string,
  input: UpdateBugStatusInput,
  actor?: AuditActor,
): Promise<BugReport> {
  const existing = await loadBugReportById(id)
  if (!existing) {
    throw new Error('Bug não encontrado.')
  }

  if (existing.status === input.status) {
    return existing
  }

  const now = new Date().toISOString()
  const historyEntry: BugStatusHistoryEntry = {
    id: `bhist-${randomUUID()}`,
    fromStatus: existing.status,
    toStatus: input.status,
    changedById: input.changedById,
    changedByName: input.changedByName,
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    changedAt: now,
  }

  const updated: BugReport = {
    ...existing,
    status: input.status,
    updatedAt: now,
    history: [historyEntry, ...existing.history],
  }

  await saveBugReport(updated)
  notifyBugs('status_updated', updated.id)

  await safeAudit(actor, {
    entityType: 'production',
    entityId: updated.id,
    action: 'status_change',
    summary: `Bug "${updated.title}" alterado para ${input.status}`,
    before: { status: existing.status },
    after: { status: input.status, historyEntry },
  })

  return updated
}
