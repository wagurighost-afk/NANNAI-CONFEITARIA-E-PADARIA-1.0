import { Router } from 'express'
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

  const unsubscribe = subscribeRealtime((event) => {
    send(event)
  })

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 25_000)

  req.on('close', () => {
    clearInterval(heartbeat)
    unsubscribe()
    res.end()
  })
})
