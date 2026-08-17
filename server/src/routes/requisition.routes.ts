import { Router } from 'express'
import type { Response } from 'express'
import { toAuditActor } from '../audit/actor.js'
import { isMasterAdmin } from '../auth/roles.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAdmin, requireAuth } from '../middleware.js'
import {
  getRequisitionStockLimits,
  saveRequisitionStockLimits,
  approveRequisition,
  createRequisition,
  fulfillRequisition,
  getRequisition,
  listRequisitions,
  rejectRequisition,
  startRequisitionReview,
  submitRequisition,
  updateRequisition,
} from '../requisition.service.js'
import type { SaveRequisitionInput } from '../requisition/types.js'

export const requisitionRouter = Router()

requisitionRouter.use(requireAuth)

function statusForError(error: unknown): number {
  const message =
    error instanceof Error ? error.message.toLowerCase() : ''

  if (message.includes('não encontrada')) {
    return 404
  }

  if (message.includes('sem permissão')) {
    return 403
  }

  if (
    message.includes('transição inválida') ||
    message.includes('rascunho')
  ) {
    return 409
  }

  return 400
}

function sendError(res: Response, error: unknown) {
  res.status(statusForError(error)).json({
    message:
      error instanceof Error
        ? error.message
        : 'Não foi possível processar a requisição.',
  })
}

requisitionRouter.get('/', async (req: AuthedRequest, res) => {
  try {
    const admin = isMasterAdmin(req.user!)

    res.json(
      await listRequisitions(
        admin ? undefined : req.user!.id,
      ),
    )
  } catch (error) {
    sendError(res, error)
  }
})

requisitionRouter.get(
  '/stock-limits',
  async (_req, res) => {
    try {
      res.json(
        await getRequisitionStockLimits(),
      )
    } catch (error) {
      sendError(res, error)
    }
  },
)

requisitionRouter.put(
  '/stock-limits',
  requireAdmin,
  async (req, res) => {
    try {
      res.json(
        await saveRequisitionStockLimits(
          req.body?.limits ?? req.body,
        ),
      )
    } catch (error) {
      sendError(res, error)
    }
  },
)

requisitionRouter.get('/:id', async (req: AuthedRequest, res) => {
  try {
    const record = await getRequisition(String(req.params.id))

    if (!record) {
      res.status(404).json({
        message: 'Requisição não encontrada.',
      })
      return
    }

    if (
      !isMasterAdmin(req.user!) &&
      record.responsible.userId !== req.user!.id
    ) {
      res.status(403).json({
        message: 'Sem permissão para visualizar esta requisição.',
      })
      return
    }

    res.json(record)
  } catch (error) {
    sendError(res, error)
  }
})

requisitionRouter.post('/', async (req: AuthedRequest, res) => {
  try {
    const record = await createRequisition(
      (req.body ?? {}) as SaveRequisitionInput,
      toAuditActor(req.user!),
    )

    res.status(201).json(record)
  } catch (error) {
    sendError(res, error)
  }
})

requisitionRouter.patch('/:id', async (req: AuthedRequest, res) => {
  try {
    const record = await updateRequisition(
      String(req.params.id),
      (req.body ?? {}) as SaveRequisitionInput,
      toAuditActor(req.user!),
      isMasterAdmin(req.user!),
    )

    res.json(record)
  } catch (error) {
    sendError(res, error)
  }
})

requisitionRouter.post('/:id/submit', async (req: AuthedRequest, res) => {
  try {
    const record = await submitRequisition(
      String(req.params.id),
      toAuditActor(req.user!),
      isMasterAdmin(req.user!),
      req.body?.note,
    )

    res.json(record)
  } catch (error) {
    sendError(res, error)
  }
})

requisitionRouter.post(
  '/:id/review',
  requireAdmin,
  async (req: AuthedRequest, res) => {
    try {
      res.json(
        await startRequisitionReview(
          String(req.params.id),
          toAuditActor(req.user!),
          req.body?.note,
        ),
      )
    } catch (error) {
      sendError(res, error)
    }
  },
)

requisitionRouter.post(
  '/:id/approve',
  requireAdmin,
  async (req: AuthedRequest, res) => {
    try {
      res.json(
        await approveRequisition(
          String(req.params.id),
          toAuditActor(req.user!),
          req.body?.note,
        ),
      )
    } catch (error) {
      sendError(res, error)
    }
  },
)

requisitionRouter.post(
  '/:id/reject',
  requireAdmin,
  async (req: AuthedRequest, res) => {
    try {
      res.json(
        await rejectRequisition(
          String(req.params.id),
          toAuditActor(req.user!),
          req.body?.note,
        ),
      )
    } catch (error) {
      sendError(res, error)
    }
  },
)

requisitionRouter.post(
  '/:id/fulfill',
  requireAdmin,
  async (req: AuthedRequest, res) => {
    try {
      res.json(
        await fulfillRequisition(
          String(req.params.id),
          toAuditActor(req.user!),
          req.body?.note,
        ),
      )
    } catch (error) {
      sendError(res, error)
    }
  },
)