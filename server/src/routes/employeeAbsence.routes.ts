import { Router } from 'express'
import { toAuditActor } from '../audit/actor.js'
import {
  cancelEmployeeAbsence,
  createEmployeeAbsence,
  EmployeeAbsenceError,
  getEmployeeAbsenceById,
  listEmployeeAbsencesByEmployee,
  listEmployeeAbsencesByRange,
  updateEmployeeAbsence,
  type CreateEmployeeAbsenceInput,
  type UpdateEmployeeAbsenceInput,
} from '../employeeAbsence.service.js'
import type { AuthedRequest } from '../middleware.js'
import { requireAdmin, requireAuth } from '../middleware.js'

export const employeeAbsenceRouter = Router()

employeeAbsenceRouter.use(requireAuth)

function includeCancelled(value: unknown): boolean {
  return String(value ?? '').toLowerCase() === 'true'
}

function sendKnownError(
  res: import('express').Response,
  error: unknown,
): boolean {
  if (!(error instanceof EmployeeAbsenceError)) {
    return false
  }

  res.status(error.statusCode).json({
    message: error.message,
  })

  return true
}

employeeAbsenceRouter.get('/range', requireAdmin, async (req, res) => {
  try {
    const items = await listEmployeeAbsencesByRange(
      String(req.query.startDate ?? ''),
      String(req.query.endDate ?? ''),
      includeCancelled(req.query.includeCancelled),
    )

    res.json(items)
  } catch (error) {
    if (!sendKnownError(res, error)) {
      res.status(500).json({
        message: 'Erro ao consultar períodos de ausência.',
      })
    }
  }
})

employeeAbsenceRouter.get(
  '/employee/:employeeId',
  requireAdmin,
  async (req, res) => {
    try {
      const items = await listEmployeeAbsencesByEmployee(
        req.params.employeeId,
        includeCancelled(req.query.includeCancelled),
      )

      res.json(items)
    } catch (error) {
      if (!sendKnownError(res, error)) {
        res.status(500).json({
          message: 'Erro ao consultar ausências do colaborador.',
        })
      }
    }
  },
)

employeeAbsenceRouter.get('/:id', requireAdmin, async (req, res) => {
  try {
    res.json(await getEmployeeAbsenceById(req.params.id))
  } catch (error) {
    if (!sendKnownError(res, error)) {
      res.status(500).json({
        message: 'Erro ao consultar período de ausência.',
      })
    }
  }
})

employeeAbsenceRouter.post(
  '/',
  requireAdmin,
  async (req: AuthedRequest, res) => {
    try {
      const result = await createEmployeeAbsence(
        req.body as CreateEmployeeAbsenceInput,
        toAuditActor(req.user!),
      )

      res.status(201).json(result)
    } catch (error) {
      if (!sendKnownError(res, error)) {
        res.status(500).json({
          message: 'Erro ao criar período de ausência.',
        })
      }
    }
  },
)

employeeAbsenceRouter.patch(
  '/:id',
  requireAdmin,
  async (req: AuthedRequest, res) => {
    try {
      const result = await updateEmployeeAbsence(
        req.params.id,
        req.body as UpdateEmployeeAbsenceInput,
        toAuditActor(req.user!),
      )

      res.json(result)
    } catch (error) {
      if (!sendKnownError(res, error)) {
        res.status(500).json({
          message: 'Erro ao atualizar período de ausência.',
        })
      }
    }
  },
)

employeeAbsenceRouter.post(
  '/:id/cancel',
  requireAdmin,
  async (req: AuthedRequest, res) => {
    try {
      const result = await cancelEmployeeAbsence(
        req.params.id,
        String(req.body?.reason ?? ''),
        toAuditActor(req.user!),
      )

      res.json(result)
    } catch (error) {
      if (!sendKnownError(res, error)) {
        res.status(500).json({
          message: 'Erro ao cancelar período de ausência.',
        })
      }
    }
  },
)