import { Router } from 'express'
import { getUserById, login, logout, refreshSession } from '../auth.service.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth } from '../middleware.js'

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '')
    const password = String(req.body?.password ?? '')
    const session = await login(email, password)
    res.json(session)
  } catch (error) {
    res.status(401).json({ message: error instanceof Error ? error.message : 'Falha no login.' })
  }
})

authRouter.get('/me', requireAuth, (req: AuthedRequest, res) => {
  res.json(req.user)
})

authRouter.post('/refresh', async (req, res) => {
  try {
    const refreshToken = String(req.body?.refreshToken ?? '')
    const session = await refreshSession(refreshToken)
    res.json(session)
  } catch (error) {
    res.status(401).json({ message: error instanceof Error ? error.message : 'Sessão expirada.' })
  }
})

authRouter.post('/logout', async (req, res) => {
  await logout(typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : undefined)
  res.status(204).send()
})

authRouter.get('/users/:id', requireAuth, async (req, res) => {
  try {
    res.json(await getUserById(req.params.id))
  } catch (error) {
    res.status(404).json({ message: error instanceof Error ? error.message : 'Não encontrado.' })
  }
})
