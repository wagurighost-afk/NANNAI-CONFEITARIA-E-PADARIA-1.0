import { cpSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcDir = join(__dirname, '../src/data')
const distDir = join(__dirname, '../dist/data')

mkdirSync(distDir, { recursive: true })

for (const file of readdirSync(srcDir)) {
  if (file.endsWith('.json')) {
    cpSync(join(srcDir, file), join(distDir, file))
  }
}
