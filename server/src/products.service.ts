import { randomUUID } from 'node:crypto'
import {
  deleteProductRecord,
  getMeta,
  loadAllProducts,
  loadProductRecord,
  saveProductRecord,
  setMeta,
} from './db/index.js'
import { PRODUCTS_MASTER_PART1 } from './data/productsMasterPart1.js'
import type { CatalogProduct, ProductImportSummary, ProductOrigin, ProductStatus } from './types.js'

const LAST_IMPORT_META_KEY = 'products_last_import_summary'

export function normalizeProductNameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function sameCost(a: number, b: number): boolean {
  return Math.abs(roundMoney(a) - roundMoney(b)) < 0.001
}

export async function listProducts(search = ''): Promise<CatalogProduct[]> {
  const products = await loadAllProducts()
  const query = normalizeProductNameKey(search)
  const filtered = query
    ? products.filter((product) => product.nameKey.includes(query) || product.name.toLowerCase().includes(search.toLowerCase()))
    : products

  return filtered.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function getProductById(id: string): Promise<CatalogProduct | null> {
  return loadProductRecord(id)
}

export async function createProduct(input: {
  name: string
  costPerPortion: number
  status?: ProductStatus
  origin?: ProductOrigin
}): Promise<CatalogProduct> {
  const name = input.name.trim()
  if (!name) {
    throw new Error('Nome do produto é obrigatório.')
  }

  const nameKey = normalizeProductNameKey(name)
  const existing = (await loadAllProducts()).find((product) => product.nameKey === nameKey)
  if (existing) {
    throw new Error('Já existe um produto com este nome.')
  }

  const now = new Date().toISOString()
  const product: CatalogProduct = {
    id: `prd-${randomUUID()}`,
    name,
    nameKey,
    costPerPortion: roundMoney(Math.max(0, Number(input.costPerPortion) || 0)),
    status: input.status ?? 'Ativo',
    origin: input.origin ?? 'Manual',
    editable: true,
    createdAt: now,
    updatedAt: now,
  }

  await saveProductRecord(product)
  return product
}

export async function updateProduct(
  id: string,
  input: { name?: string; costPerPortion?: number; status?: ProductStatus },
): Promise<CatalogProduct> {
  const current = await loadProductRecord(id)
  if (!current) {
    throw new Error('Produto não encontrado.')
  }
  if (!current.editable) {
    throw new Error('Este produto não permite edição.')
  }

  let name = current.name
  let nameKey = current.nameKey
  if (typeof input.name === 'string' && input.name.trim()) {
    name = input.name.trim()
    nameKey = normalizeProductNameKey(name)
    const conflict = (await loadAllProducts()).find(
      (product) => product.id !== id && product.nameKey === nameKey,
    )
    if (conflict) {
      throw new Error('Já existe um produto com este nome.')
    }
  }

  const updated: CatalogProduct = {
    ...current,
    name,
    nameKey,
    costPerPortion:
      typeof input.costPerPortion === 'number'
        ? roundMoney(Math.max(0, input.costPerPortion))
        : current.costPerPortion,
    status: input.status ?? current.status,
    editable: true,
    updatedAt: new Date().toISOString(),
  }

  await saveProductRecord(updated)
  return updated
}

export async function removeProduct(id: string): Promise<void> {
  const current = await loadProductRecord(id)
  if (!current) {
    throw new Error('Produto não encontrado.')
  }
  await deleteProductRecord(id)
}

export async function importMasterProducts(
  items: Array<{ name: string; costPerPortion: number }>,
  options?: { partLabel?: string },
): Promise<ProductImportSummary> {
  const existing = await loadAllProducts()
  const byName = new Map(existing.map((product) => [product.nameKey, product]))

  // Colapsa duplicatas da própria lista (mantém o último custo) e conta como ignoradas.
  const collapsed: Array<{ name: string; nameKey: string; costPerPortion: number }> = []
  const indexByKey = new Map<string, number>()
  let ignored = 0

  for (const item of items) {
    const name = item.name.trim()
    if (!name) {
      ignored += 1
      continue
    }
    const nameKey = normalizeProductNameKey(name)
    const costPerPortion = roundMoney(Math.max(0, Number(item.costPerPortion) || 0))
    const existingIndex = indexByKey.get(nameKey)
    if (existingIndex !== undefined) {
      collapsed[existingIndex] = { name, nameKey, costPerPortion }
      ignored += 1
      continue
    }
    indexByKey.set(nameKey, collapsed.length)
    collapsed.push({ name, nameKey, costPerPortion })
  }

  let created = 0
  let updated = 0
  const now = new Date().toISOString()

  for (const item of collapsed) {
    const current = byName.get(item.nameKey)

    if (!current) {
      const product: CatalogProduct = {
        id: `prd-${randomUUID()}`,
        name: item.name,
        nameKey: item.nameKey,
        costPerPortion: item.costPerPortion,
        status: 'Ativo',
        origin: 'Cadastro Mestre',
        editable: true,
        createdAt: now,
        updatedAt: now,
      }
      await saveProductRecord(product)
      byName.set(item.nameKey, product)
      created += 1
      continue
    }

    if (sameCost(current.costPerPortion, item.costPerPortion)) {
      ignored += 1
      continue
    }

    const next: CatalogProduct = {
      ...current,
      costPerPortion: item.costPerPortion,
      status: 'Ativo',
      origin: current.origin === 'Manual' ? 'Cadastro Mestre' : current.origin,
      editable: true,
      updatedAt: now,
    }
    await saveProductRecord(next)
    byName.set(item.nameKey, next)
    updated += 1
  }

  const summary: ProductImportSummary = {
    partLabel: options?.partLabel ?? 'Cadastro Mestre',
    created,
    updated,
    ignored,
    totalProcessed: items.length,
    importedAt: now,
  }

  await setMeta(LAST_IMPORT_META_KEY, JSON.stringify(summary))
  return summary
}

export async function importMasterPart1(): Promise<ProductImportSummary> {
  return importMasterProducts(PRODUCTS_MASTER_PART1, { partLabel: 'Cadastro Mestre — Parte 1' })
}

export async function getLastImportSummary(): Promise<ProductImportSummary | null> {
  const raw = await getMeta(LAST_IMPORT_META_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as ProductImportSummary
  } catch {
    return null
  }
}
