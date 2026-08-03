export interface OnlineUserSession {
  sessionId: string
  userId: string
  userName: string
  userEmail: string
  role: string
  connectedAt: string
  lastSeenAt: string
}

const sessions = new Map<string, OnlineUserSession>()

const STALE_MS = 90_000

export function registerOnlineSession(
  sessionId: string,
  user: { id: string; name: string; email: string; role: string },
): void {
  const now = new Date().toISOString()
  sessions.set(sessionId, {
    sessionId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    role: user.role,
    connectedAt: now,
    lastSeenAt: now,
  })
}

export function touchOnlineSession(sessionId: string): void {
  const session = sessions.get(sessionId)
  if (!session) {
    return
  }
  sessions.set(sessionId, {
    ...session,
    lastSeenAt: new Date().toISOString(),
  })
}

export function unregisterOnlineSession(sessionId: string): void {
  sessions.delete(sessionId)
}

export function listOnlineUsers(): OnlineUserSession[] {
  const now = Date.now()
  const active: OnlineUserSession[] = []

  for (const [sessionId, session] of sessions.entries()) {
    const lastSeen = new Date(session.lastSeenAt).getTime()
    if (now - lastSeen > STALE_MS) {
      sessions.delete(sessionId)
      continue
    }
    active.push(session)
  }

  return active.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
}

export function getOnlineUserCount(): number {
  return listOnlineUsers().length
}
