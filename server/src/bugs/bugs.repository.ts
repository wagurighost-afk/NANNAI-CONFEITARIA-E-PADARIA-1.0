import { getMeta, setMeta } from '../db/index.js'
import type { BugReport } from './types.js'

const BUG_REPORTS_META_KEY = 'bug_reports'

export async function loadAllBugReports(): Promise<BugReport[]> {
  const raw = await getMeta(BUG_REPORTS_META_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as BugReport[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveAllBugReports(reports: BugReport[]): Promise<void> {
  await setMeta(BUG_REPORTS_META_KEY, JSON.stringify(reports))
}

export async function loadBugReportById(id: string): Promise<BugReport | null> {
  const reports = await loadAllBugReports()
  return reports.find((report) => report.id === id) ?? null
}

export async function saveBugReport(report: BugReport): Promise<void> {
  const reports = await loadAllBugReports()
  const index = reports.findIndex((item) => item.id === report.id)

  if (index >= 0) {
    reports[index] = report
  } else {
    reports.unshift(report)
  }

  await saveAllBugReports(reports)
}
