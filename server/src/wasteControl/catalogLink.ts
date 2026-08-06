/**
 * Fonte única do desperdício do dia: Cadastro de Produtos.
 * A seed antiga só ajuda a sugerir setor/buffet quando o nome coincide.
 */
import { WASTE_PRODUCTS } from '../data/wasteProductsSeed.js'
import { loadAllProducts } from '../db/index.js'
import { normalizeProductNameKey } from '../products/normalizeProductName.js'
import type {
  CatalogProduct,
  WasteBuffetType,
  WasteControlProduct,
  WasteSector,
} from '../types.js'

const ALL_BUFFETS: WasteBuffetType[] = ['cafe', 'cha', 'jantar']

function inferSector(name: string): WasteSector {
  const key = normalizeProductNameKey(name)
  const padariaHints = [
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
  if (padariaHints.some((hint) => key.includes(hint))) {
    return 'Padaria'
  }
  return 'Confeitaria'
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

  return {
    // ID estável = Cadastro de Produtos (bloco único).
    id: product.id,
    name: product.name,
    unit: 'porção',
    unitPrice: safeCost(product.costPerPortion),
    // Produtos manuais e do mestre ficam disponíveis em todos os buffets.
    buffets: ALL_BUFFETS,
    sector: seed?.sector ?? inferSector(product.name),
    catalogProductId: product.id,
    costFromCatalog: true,
    origin: product.origin,
  }
}

/**
 * Lista do desperdício = somente produtos Ativos do Cadastro de Produtos.
 */
export async function listLinkedWasteProducts(
  buffet?: WasteBuffetType,
): Promise<WasteControlProduct[]> {
  const catalog = await loadAllProducts()
  const seedByKey = new Map(
    WASTE_PRODUCTS.map((product) => [normalizeProductNameKey(product.name), product]),
  )

  const products = catalog
    .filter((product) => product.status === 'Ativo')
    .map((product) => catalogToWasteProduct(product, seedByKey))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  if (!buffet) {
    return products
  }

  return products.filter((product) => product.buffets.includes(buffet))
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
