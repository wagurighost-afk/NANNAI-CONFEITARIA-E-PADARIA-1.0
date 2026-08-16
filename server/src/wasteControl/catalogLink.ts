/**
 * Fonte única do desperdício do dia: Cadastro de Produtos.
 * A seed antiga só ajuda a sugerir setor/buffet quando o nome coincide.
 */
import { WASTE_PRODUCTS } from '../data/wasteProductsSeed.js'
import { loadAllProducts } from '../db/index.js'
import { normalizeProductNameKey } from '../products/normalizeProductName.js'
import type { WasteControlSector } from './sectors.js'
import type {
  CatalogProduct,
  WasteBuffetType,
  WasteControlProduct,
  WasteProductApplicability,
  WasteSector,
} from '../types.js'

const ALL_BUFFETS: WasteBuffetType[] = ['cafe', 'cha', 'jantar']

const PADARIA_NAME_HINTS = [
  'pao',
  'baguete',
  'focaccia',
  'croissant',
  'brioche',
  'bisnagu',
  'tiger',
  'roseta',
  'sanduiche',
  'croque',
  'quiche',
  'empada',
  'folhado',
  'broa',
]

/**
 * Aplicabilidade para filtro do controle.
 * Só classifica Padaria/Confeitaria com evidência (seed ou nome). Sem evidência → Ambos.
 * Não regrava produtos históricos.
 */
function resolveApplicability(
  name: string,
  seedSector: WasteSector | undefined,
): { sector: WasteSector; applicability: WasteProductApplicability } {
  if (seedSector === 'Padaria' || seedSector === 'Confeitaria') {
    return { sector: seedSector, applicability: seedSector }
  }

  const key = normalizeProductNameKey(name)
  if (PADARIA_NAME_HINTS.some((hint) => key.includes(hint))) {
    return { sector: 'Padaria', applicability: 'Padaria' }
  }

  return { sector: 'Confeitaria', applicability: 'Ambos' }
}

function matchesControlSector(
  applicability: WasteProductApplicability,
  sector: WasteControlSector,
): boolean {
  if (applicability === 'Ambos') {
    return true
  }
  if (sector === 'CONFEITARIA') {
    return applicability === 'Confeitaria'
  }
  return applicability === 'Padaria'
}

function safeCost(value: unknown): number {
  const amount = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(amount) || amount < 0) {
    return 0
  }
  return Math.round(amount * 100) / 100
}

function catalogToWasteProduct(
  product: CatalogProduct,
  seedByKey: Map<string, (typeof WASTE_PRODUCTS)[number]>,
): WasteControlProduct {
  const key = product.nameKey || normalizeProductNameKey(product.name)
  const seed = seedByKey.get(key)
  const classified = resolveApplicability(product.name, seed?.sector)

  return {
    // ID estável = Cadastro de Produtos (bloco único).
    id: product.id,
    name: product.name,
    unit: 'porção',
    unitPrice: safeCost(product.costPerPortion),
    // Produtos manuais e do mestre ficam disponíveis em todos os buffets.
    buffets: ALL_BUFFETS,
    sector: classified.sector,
    applicability: classified.applicability,
    catalogProductId: product.id,
    costFromCatalog: true,
    origin: product.origin,
  }
}

/**
 * Lista do desperdício = somente produtos Ativos do Cadastro de Produtos.
 */
export async function listLinkedWasteProducts(options?: {
  buffet?: WasteBuffetType
  sector?: WasteControlSector
}): Promise<WasteControlProduct[]> {
  const catalog = await loadAllProducts()
  const seedByKey = new Map(
    WASTE_PRODUCTS.map((product) => [normalizeProductNameKey(product.name), product]),
  )

  const products = catalog
    .filter((product) => product.status === 'Ativo')
    .map((product) => catalogToWasteProduct(product, seedByKey))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  return products.filter((product) => {
    if (options?.buffet && !product.buffets.includes(options.buffet)) {
      return false
    }
    if (options?.sector && !matchesControlSector(product.applicability ?? 'Ambos', options.sector)) {
      return false
    }
    return true
  })
}

/**
 * Resolve produto por ID do catálogo, ID legado waste-* ou waste-cat-*.
 */
export function resolveWasteProduct(
  products: WasteControlProduct[],
  productId: string,
): WasteControlProduct | undefined {
  const byId = new Map<string, WasteControlProduct>()

  for (const product of products) {
    byId.set(product.id, product)
    if (product.catalogProductId) {
      byId.set(product.catalogProductId, product)
      byId.set(`waste-cat-${product.catalogProductId}`, product)
    }
  }

  const direct = byId.get(productId)
  if (direct) {
    return direct
  }

  // Compatibilidade com contagens antigas que usavam waste-001, waste-002...
  const seed = WASTE_PRODUCTS.find((item) => item.id === productId)
  if (!seed) {
    return undefined
  }
  const key = normalizeProductNameKey(seed.name)
  return products.find((product) => normalizeProductNameKey(product.name) === key)
}
