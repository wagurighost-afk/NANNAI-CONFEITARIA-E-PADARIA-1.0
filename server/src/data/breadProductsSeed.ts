import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { BreadControlProduct } from '../types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface SeedFile {
  products: Array<{ section: string; name: string; unitPrice: number; paxMultiplier: number }>
  sections: string[]
}

function loadSeed(): SeedFile {
  const filePath = path.join(__dirname, 'breadProductsSeed.json')
  return JSON.parse(readFileSync(filePath, 'utf8')) as SeedFile
}

export const BREAD_SECTIONS = loadSeed().sections

export const BREAD_PRODUCTS: BreadControlProduct[] = loadSeed().products.map((product, index) => ({
  id: `bread-prod-${index + 1}`,
  section: product.section,
  name: product.name,
  unitPrice: product.unitPrice,
  paxMultiplier: product.paxMultiplier,
}))
