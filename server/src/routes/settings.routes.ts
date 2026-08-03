import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import multer from 'multer'
import { toAuditActor } from '../audit/actor.js'
import { safeAudit } from '../audit/safeAudit.js'
import { canManageSettings } from '../settings/access.js'
import { getAppSettingsResponse, updateAppSettings, updateHotelLogo } from '../settings/settings.service.js'
import type { AppSettingsPatch } from '../settings/types.js'
import { config } from '../config.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth } from '../middleware.js'

const upload = multer({
  dest: config.uploadsDir,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
})

export const settingsRouter = Router()

settingsRouter.use(requireAuth)

function assertSettingsAccess(req: AuthedRequest, res: { status: (code: number) => { json: (body: unknown) => void } }): boolean {
  if (!req.user || !canManageSettings(req.user)) {
    res.status(403).json({ message: 'Acesso restrito ao Administrador Master.' })
    return false
  }
  return true
}

settingsRouter.get('/', async (req: AuthedRequest, res) => {
  if (!assertSettingsAccess(req, res)) {
    return
  }

  try {
    res.json(await getAppSettingsResponse())
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar configurações.',
    })
  }
})

settingsRouter.patch('/', async (req: AuthedRequest, res) => {
  if (!assertSettingsAccess(req, res)) {
    return
  }

  try {
    const patch = req.body as AppSettingsPatch
    const response = await updateAppSettings(patch, req.user?.name)

    await safeAudit(toAuditActor(req.user!), {
      entityType: 'settings',
      entityId: 'app_settings',
      action: 'update',
      summary: 'Configurações avançadas atualizadas',
      after: patch,
    })

    res.json(response)
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Falha ao salvar configurações.',
    })
  }
})

settingsRouter.post('/logo', upload.single('logo'), async (req: AuthedRequest, res) => {
  if (!assertSettingsAccess(req, res)) {
    return
  }

  const file = req.file
  if (!file || !file.mimetype.startsWith('image/')) {
    res.status(400).json({ message: 'Envie uma imagem válida para o logo.' })
    return
  }

  try {
    const logoUrl = `/api/uploads/${path.basename(file.path)}`
    const response = await updateHotelLogo(logoUrl, req.user?.name)

    await safeAudit(toAuditActor(req.user!), {
      entityType: 'settings',
      entityId: 'app_settings',
      action: 'update',
      summary: 'Logo do hotel atualizado',
      after: { logoUrl },
    })

    res.json(response)
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Falha ao enviar logo.',
    })
  }
})

settingsRouter.delete('/logo', async (req: AuthedRequest, res) => {
  if (!assertSettingsAccess(req, res)) {
    return
  }

  try {
    const response = await updateAppSettings({ general: { logoUrl: null } }, req.user?.name)
    res.json(response)
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Falha ao remover logo.',
    })
  }
})
