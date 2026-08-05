import { Router } from 'express'
import type { AuthedRequest } from '../middleware.js'
import { requireAuth, requireManager } from '../middleware.js'
import {
  createProduct,
  getLastImportSummary,
  getProductById,
  importMasterPart1,
  listProducts,
  removeProduct,
  updateProduct,
} from '../products.service.js'
import type { ProductStatus } from '../types.js'

export const productsRouter = Router()

productsRouter.use(requireAuth)

productsRouter.get('/', async (req, res) => {
  const search = String(req.query.search ?? '')
  res.json(await listProducts(search))
})

productsRouter.get('/import-summary', async (_req, res) => {
  res.json(await getLastImportSummary())
})

productsRouter.post('/import/master-part-1', requireManager, async (_req, res) => {
  try {
    const summary = await importMasterPart1()
    res.json(summary)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Falha na importação.' })
  }
})

productsRouter.get('/:id', async (req, res) => {
  const product = await getProductById(req.params.id)
  if (!product) {
    res.status(404).json({ message: 'Produto não encontrado.' })
    return
  }
  res.json(product)
})

productsRouter.post('/', requireManager, async (req: AuthedRequest, res) => {
  try {
    const product = await createProduct({
      name: String(req.body.name ?? ''),
      costPerPortion: Number(req.body.costPerPortion ?? 0),
      status: (req.body.status as ProductStatus | undefined) ?? 'Ativo',
      origin: 'Manual',
    })
    res.status(201).json(product)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Dados inválidos.' })
  }
})

productsRouter.patch('/:id', requireManager, async (req, res) => {
  try {
    const product = await updateProduct(req.params.id, {
      name: typeof req.body.name === 'string' ? req.body.name : undefined,
      costPerPortion:
        typeof req.body.costPerPortion === 'number' ? req.body.costPerPortion : undefined,
      status: req.body.status as ProductStatus | undefined,
    })
    res.json(product)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Falha ao atualizar.' })
  }
})

productsRouter.delete('/:id', requireManager, async (req, res) => {
  try {
    await removeProduct(req.params.id)
    res.status(204).end()
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Falha ao excluir.' })
  }
})
