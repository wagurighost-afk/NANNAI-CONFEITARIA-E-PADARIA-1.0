import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { markRealtimeSync } from '../dev-central/metricsCollector.js'
import {
  registerOnlineSession,
  touchOnlineSession,
  unregisterOnlineSession,
} from '../dev-central/presence.js'
import { subscribeRealtime } from '../events.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth } from '../middleware.js'

export const eventsRouter = Router()

eventsRouter.get('/stream', requireAuth, (req: AuthedRequest, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  const send = (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  send({ scope: 'production', action: 'connected' })

  const sessionId = randomUUID()
  if (req.user) {
    registerOnlineSession(sessionId, {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    })
  }

  const unsubscribe = subscribeRealtime((event) => {
    markRealtimeSync()
    send(event)
  })

  const heartbeat = setInterval(() => {
    touchOnlineSession(sessionId)
    res.write(': heartbeat\n\n')
  }, 25_000)

  req.on('close', () => {
    clearInterval(heartbeat)
    unregisterOnlineSession(sessionId)
    unsubscribe()
    res.end()
  })
})
