import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import multer from 'multer'
import { toAuditActor } from '../audit/actor.js'
import { canManageBugStatus } from '../bugs/access.js'
import { BUG_MODULE_OPTIONS } from '../bugs/bugModules.js'
import { createBug, getBugById, listBugs, updateBugStatus } from '../bugs/bugs.service.js'
import type { BugAttachment, BugPriority, BugStatus } from '../bugs/types.js'
import { config } from '../config.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth } from '../middleware.js'

const upload = multer({
  dest: config.uploadsDir,
  limits: { fileSize: 80 * 1024 * 1024, files: 4 },
})

export const bugsRouter = Router()

bugsRouter.use(requireAuth)

function mapUploadedFile(file: Express.Multer.File, kind: 'image' | 'video'): BugAttachment {
  return {
    id: `batt-${randomUUID()}`,
    fileName: file.originalname,
    mimeType: file.mimetype,
    fileUrl: `/api/uploads/${path.basename(file.path)}`,
    kind,
  }
}

bugsRouter.get('/modules', (_req, res) => {
  res.json(BUG_MODULE_OPTIONS)
})

bugsRouter.get('/', async (req, res) => {
  try {
    const result = await listBugs({
      search: String(req.query.search ?? ''),
      status: String(req.query.status ?? 'all') as BugStatus | 'all',
      priority: String(req.query.priority ?? 'all') as BugPriority | 'all',
      moduleId: String(req.query.moduleId ?? 'all'),
      reportedById: String(req.query.reportedById ?? 'all'),
      limit: Number(req.query.limit ?? 50),
      offset: Number(req.query.offset ?? 0),
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao listar bugs.',
    })
  }
})

bugsRouter.get('/:id', async (req, res) => {
  try {
    const bug = await getBugById(req.params.id)
    if (!bug) {
      res.status(404).json({ message: 'Bug não encontrado.' })
      return
    }
    res.json(bug)
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao carregar bug.',
    })
  }
})

bugsRouter.post(
  '/',
  upload.fields([
    { name: 'images', maxCount: 3 },
    { name: 'video', maxCount: 1 },
  ]),
  async (req: AuthedRequest, res) => {
    try {
      const files = req.files as {
        images?: Express.Multer.File[]
        video?: Express.Multer.File[]
      }

      const images = (files.images ?? [])
        .filter((file) => file.mimetype.startsWith('image/'))
        .map((file) => mapUploadedFile(file, 'image'))

      const videoFile = (files.video ?? []).find((file) => file.mimetype.startsWith('video/'))
      const video = videoFile ? mapUploadedFile(videoFile, 'video') : undefined

      const bug = await createBug(
        {
          title: String(req.body.title ?? ''),
          description: String(req.body.description ?? ''),
          moduleId: String(req.body.moduleId ?? 'outro'),
          moduleName: String(req.body.moduleName ?? ''),
          priority: String(req.body.priority ?? 'media') as BugPriority,
          os: String(req.body.os ?? 'Desconhecido'),
          browser: String(req.body.browser ?? 'Desconhecido'),
          appVersion: String(req.body.appVersion ?? '0.0.0'),
          reportedById: String(req.body.reportedById ?? req.user?.id ?? 'unknown'),
          reportedByName: String(req.body.reportedByName ?? req.user?.name ?? 'Usuário'),
          reportedByEmail: String(req.body.reportedByEmail ?? req.user?.email ?? ''),
          images,
          ...(video ? { video } : {}),
        },
        toAuditActor(req.user!),
      )

      res.status(201).json(bug)
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Falha ao reportar bug.',
      })
    }
  },
)

bugsRouter.patch('/:id/status', async (req: AuthedRequest, res) => {
  if (!req.user || !canManageBugStatus(req.user)) {
    res.status(403).json({ message: 'Somente Administradores Master podem alterar o status.' })
    return
  }

  try {
    const updated = await updateBugStatus(
      req.params.id,
      {
        status: String(req.body.status) as BugStatus,
        note: typeof req.body.note === 'string' ? req.body.note : undefined,
        changedById: req.user.id,
        changedByName: req.user.name,
      },
      toAuditActor(req.user),
    )
    res.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao atualizar status.'
    const status = message.includes('não encontrado') ? 404 : 400
    res.status(status).json({ message })
  }
})
