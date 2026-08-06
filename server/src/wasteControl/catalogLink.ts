/**
 * Vincula Cadastro de Produtos ao Controle de Desperdício.
 * Custo do dia usa `costPerPortion` do catálogo quando o nome bate.
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

function toLinkedProduct(
  base: {
    id: string
    name: string
    unit: string
    unitPrice: number
    buffets: WasteBuffetType[]
    sector: WasteSector
  },
  catalog: CatalogProduct | undefined,
): WasteControlProduct {
  if (!catalog) {
    return {
      ...base,
      catalogProductId: null,
      costFromCatalog: false,
    }
  }

  return {
    ...base,
    name: catalog.name,
    unitPrice: catalog.costPerPortion,
    catalogProductId: catalog.id,
    costFromCatalog: true,
  }
}

/**
 * Lista produtos de desperdício enriquecidos com o Cadastro de Produtos.
 * - Produtos da seed recebem custo do catálogo quando o nome coincide
 * - Produtos ativos só no catálogo entram como itens extras do buffet
 */
export async function listLinkedWasteProducts(
  buffet?: WasteBuffetType,
): Promise<WasteControlProduct[]> {
  const catalog = await loadAllProducts()
  const catalogByKey = new Map(
    catalog.map((product) => [product.nameKey || normalizeProductNameKey(product.name), product]),
  )
  const usedCatalogIds = new Set<string>()

  const linkedFromSeed = WASTE_PRODUCTS.map((product) => {
    const key = normalizeProductNameKey(product.name)
    const match = catalogByKey.get(key)
    if (match) {
      usedCatalogIds.add(match.id)
    }
    return toLinkedProduct(product, match)
  })

  const catalogOnly = catalog
    .filter((product) => product.status === 'Ativo' && !usedCatalogIds.has(product.id))
    .map((product) =>
      toLinkedProduct(
        {
          id: `waste-cat-${product.id}`,
          name: product.name,
          unit: 'KG',
          unitPrice: product.costPerPortion,
          buffets: ALL_BUFFETS,
          sector: inferSector(product.name),
        },
        product,
      ),
    )

  const all = [...linkedFromSeed, ...catalogOnly].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR'),
  )

  if (!buffet) {
    return all
  }

  return all.filter((product) => product.buffets.includes(buffet))
}
