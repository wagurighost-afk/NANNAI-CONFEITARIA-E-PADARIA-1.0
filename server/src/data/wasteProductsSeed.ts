import seed from './wasteProductsSeed.json' with { type: 'json' }
import type { WasteControlProduct } from '../types.js'

export const WASTE_PRODUCTS: WasteControlProduct[] = seed as WasteControlProduct[]

export function listWasteProductsForBuffet(buffet: WasteControlProduct['buffets'][number]): WasteControlProduct[] {
  return WASTE_PRODUCTS.filter((product) => product.buffets.includes(buffet))
}
