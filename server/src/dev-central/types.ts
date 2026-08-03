export interface DevCentralOnlineUser {
  sessionId: string
  userId: string
  userName: string
  userEmail: string
  role: string
  roleLabel: string
  badges: Array<'founder'>
  connectedAt: string
  lastSeenAt: string
}

export interface DevCentralMetrics {
  averageResponseMs: number
  latestResponseMs: number
  requestCount: number
  errorCount: number
  lastSyncAt: string | null
}

export interface DevCentralDatabaseTable {
  name: string
  count: number
}

export interface DevCentralDatabaseUsage {
  mode: 'postgresql' | 'json-file'
  totalRecords: number
  fileSizeBytes: number | null
  tables: DevCentralDatabaseTable[]
}

export interface DevCentralLogEntry {
  level: 'info' | 'warn' | 'error'
  message: string
  at: string
  context?: string
}

export interface DevCentralErrorEntry {
  message: string
  path: string
  status: number
  at: string
}

export interface DevCentralUpdateEntry {
  id: string
  summary: string
  actorName: string
  createdAt: string
  entityType: string
  action: string
}

export interface DevCentralDeployInfo {
  version: string
  serverStartedAt: string
  lastDeployAt: string
  environment: 'development' | 'production'
}

export interface DevCentralCharts {
  responseTime: Array<{ label: string; ms: number }>
  requestsPerMinute: Array<{ label: string; count: number }>
  errorsPerMinute: Array<{ label: string; count: number }>
  databaseTables: Array<{ name: string; count: number }>
}

export interface DevCentralDashboard {
  generatedAt: string
  onlineUsers: DevCentralOnlineUser[]
  onlineUserCount: number
  metrics: DevCentralMetrics
  database: DevCentralDatabaseUsage
  logs: DevCentralLogEntry[]
  errors: DevCentralErrorEntry[]
  updates: DevCentralUpdateEntry[]
  deploy: DevCentralDeployInfo
  charts: DevCentralCharts
}
