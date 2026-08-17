import { Router } from 'express'
import { requireAuth } from '../middleware.js'
import {
  createRequisition,
  finalizeRequisition,
  getRequisition,
  listRequisitions,
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

  if (message.includes('finalizada')) {
    return 409
  }

  return 400
}

function sendError(res: Parameters<typeof requisitionRouter.get>[1] extends never ? never : any, error: unknown) {
  res.status(statusForError(error)).json({
    message:
      error instanceof Error
        ? error.message
        : 'Não foi possível processar a requisição.',
  })
}

requisitionRouter.get('/', async (_req, res) => {
  try {
    res.json(await listRequisitions())
  } catch (error) {
    sendError(res, error)
  }
})

requisitionRouter.get('/:id', async (req, res) => {
  try {
    const record = await getRequisition(String(req.params.id))

    if (!record) {
      res.status(404).json({ message: 'Requisição não encontrada.' })
      return
    }

    res.json(record)
  } catch (error) {
    sendError(res, error)
  }
})

requisitionRouter.post('/', async (req, res) => {
  try {
    const record = await createRequisition(
      (req.body ?? {}) as SaveRequisitionInput,
    )

    res.status(201).json(record)
  } catch (error) {
    sendError(res, error)
  }
})

requisitionRouter.patch('/:id', async (req, res) => {
  try {
    const record = await updateRequisition(
      String(req.params.id),
      (req.body ?? {}) as SaveRequisitionInput,
    )

    res.json(record)
  } catch (error) {
    sendError(res, error)
  }
})

requisitionRouter.post('/:id/finalize', async (req, res) => {
  try {
    const record = await finalizeRequisition(String(req.params.id))
    res.json(record)
  } catch (error) {
    sendError(res, error)
  }
})