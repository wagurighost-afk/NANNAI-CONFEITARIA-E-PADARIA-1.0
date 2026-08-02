import { Router } from 'express'
import {
  changePassword,
  getEmployeePassword,
  getUserById,
  login,
  logout,
  refreshSession,
  resetEmployeePassword,
} from '../auth.service.js'
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

authRouter.post('/change-password', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword ?? '')
    const newPassword = String(req.body?.newPassword ?? '')

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Informe a senha atual e a nova senha.' })
      return
    }

    await changePassword(req.user!.id, currentPassword, newPassword, req.user!)
    res.json({ message: 'Senha alterada com sucesso.' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível alterar a senha.'
    const status = message.includes('incorreta') ? 401 : 400
    res.status(status).json({ message })
  }
})

authRouter.get('/users/:id', requireAuth, async (req, res) => {
  try {
    res.json(await getUserById(req.params.id))
  } catch (error) {
    res.status(404).json({ message: error instanceof Error ? error.message : 'Não encontrado.' })
  }
})

authRouter.get('/users/by-employee/:employeeId/password', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const result = await getEmployeePassword(req.user!, req.params.employeeId)
    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível consultar a senha.'
    const status = message.includes('permissão') ? 403 : 404
    res.status(status).json({ message })
  }
})

authRouter.post('/users/by-employee/:employeeId/reset-password', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : undefined
    const result = await resetEmployeePassword(req.user!, req.params.employeeId, newPassword)
    res.json({
      ...result,
      message: 'Senha redefinida com sucesso.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível redefinir a senha.'
    const status = message.includes('permissão') ? 403 : 400
    res.status(status).json({ message })
  }
})
