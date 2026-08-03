const MAX_REQUEST_SAMPLES = 240
const MAX_ERROR_SAMPLES = 80
const MAX_LOG_SAMPLES = 120

export interface RequestMetricSample {
  method: string
  path: string
  status: number
  durationMs: number
  at: string
}

export interface ErrorMetricSample {
  message: string
  path: string
  status: number
  at: string
}

export interface DevCentralLogEntry {
  level: 'info' | 'warn' | 'error'
  message: string
  at: string
  context?: string
}

const requestSamples: RequestMetricSample[] = []
const errorSamples: ErrorMetricSample[] = []
const logEntries: DevCentralLogEntry[] = []

let lastSyncAt: string | null = null
let lastRequestAt: string | null = null
export const serverStartedAt = new Date().toISOString()

export function recordRequestMetric(sample: RequestMetricSample): void {
  requestSamples.push(sample)
  if (requestSamples.length > MAX_REQUEST_SAMPLES) {
    requestSamples.splice(0, requestSamples.length - MAX_REQUEST_SAMPLES)
  }
  lastRequestAt = sample.at
  lastSyncAt = sample.at
}

export function recordErrorMetric(sample: ErrorMetricSample): void {
  errorSamples.push(sample)
  if (errorSamples.length > MAX_ERROR_SAMPLES) {
    errorSamples.splice(0, errorSamples.length - MAX_ERROR_SAMPLES)
  }
  appendLog({
    level: 'error',
    message: sample.message,
    at: sample.at,
    context: sample.path,
  })
}

export function appendLog(entry: DevCentralLogEntry): void {
  logEntries.unshift(entry)
  if (logEntries.length > MAX_LOG_SAMPLES) {
    logEntries.length = MAX_LOG_SAMPLES
  }
}

export function markRealtimeSync(at = new Date().toISOString()): void {
  lastSyncAt = at
}

export function getRequestSamples(): RequestMetricSample[] {
  return [...requestSamples]
}

export function getErrorSamples(): ErrorMetricSample[] {
  return [...errorSamples]
}

export function getLogEntries(): DevCentralLogEntry[] {
  return [...logEntries]
}

export function getLastSyncAt(): string | null {
  return lastSyncAt ?? lastRequestAt
}

export function getAverageResponseMs(window = 60): number {
  const samples = requestSamples.slice(-window)
  if (samples.length === 0) {
    return 0
  }
  const total = samples.reduce((sum, item) => sum + item.durationMs, 0)
  return Math.round(total / samples.length)
}

export function getLatestResponseMs(): number {
  const latest = requestSamples.at(-1)
  return latest?.durationMs ?? 0
}

export function buildResponseTimeSeries(limit = 30): Array<{ label: string; ms: number }> {
  return requestSamples.slice(-limit).map((sample) => ({
    label: new Date(sample.at).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    ms: sample.durationMs,
  }))
}

export function buildRequestsPerMinuteSeries(limit = 12): Array<{ label: string; count: number }> {
  const buckets = new Map<string, number>()

  for (const sample of requestSamples) {
    const date = new Date(sample.at)
    const key = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  return [...buckets.entries()]
    .slice(-limit)
    .map(([label, count]) => ({ label, count }))
}

export function buildErrorsSeries(limit = 12): Array<{ label: string; count: number }> {
  const buckets = new Map<string, number>()

  for (const sample of errorSamples) {
    const date = new Date(sample.at)
    const key = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  return [...buckets.entries()]
    .slice(-limit)
    .map(([label, count]) => ({ label, count }))
}
