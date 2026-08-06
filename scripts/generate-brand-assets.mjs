import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const sourcePath = path.join(root, 'public', 'brand', 'source', 'nannai-brand.png')
const brandDir = path.join(root, 'public', 'brand')
const iconsDir = path.join(root, 'public', 'icons')
const publicDir = path.join(root, 'public')

await fs.mkdir(brandDir, { recursive: true })
await fs.mkdir(iconsDir, { recursive: true })

const source = sharp(sourcePath)
const metadata = await source.metadata()
const width = metadata.width ?? 1024
const height = metadata.height ?? 1024

// Full branding kit — optimized WebP for UI (login, about, splash)
await sharp(sourcePath)
  .resize({ width: 720, withoutEnlargement: true })
  .webp({ quality: 82, effort: 6 })
  .toFile(path.join(brandDir, 'nannai-brand-full.webp'))

// PNG fallback for environments without WebP
await sharp(sourcePath)
  .resize({ width: 720, withoutEnlargement: true })
  .png({ compressionLevel: 9, palette: true })
  .toFile(path.join(brandDir, 'nannai-brand-full.png'))

// Badge crop for app icon (top seal area)
const iconCropHeight = Math.round(height * 0.42)
const iconCropWidth = Math.min(width, iconCropHeight)
const iconLeft = Math.round((width - iconCropWidth) / 2)

const iconBase = sharp(sourcePath).extract({
  left: iconLeft,
  top: 0,
  width: iconCropWidth,
  height: iconCropHeight,
})

await iconBase
  .clone()
  .resize(512, 512, { fit: 'contain', background: '#FDF8F3' })
  .webp({ quality: 85 })
  .toFile(path.join(brandDir, 'nannai-icon.webp'))

const iconSizes = [512, 256, 192, 180, 64, 32, 16]

for (const size of iconSizes) {
  const fileName = `icon-${size}.png`
  await iconBase
    .clone()
    .resize(size, size, { fit: 'contain', background: '#FDF8F3' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(iconsDir, fileName))
}

// Legacy PWA filenames used by existing config
await fs.copyFile(path.join(iconsDir, 'icon-192.png'), path.join(publicDir, 'pwa-192x192.png'))
await fs.copyFile(path.join(iconsDir, 'icon-512.png'), path.join(publicDir, 'pwa-512x512.png'))
await fs.copyFile(path.join(iconsDir, 'icon-32.png'), path.join(publicDir, 'favicon-32x32.png'))
await fs.copyFile(path.join(iconsDir, 'icon-16.png'), path.join(publicDir, 'favicon-16x16.png'))
await fs.copyFile(path.join(iconsDir, 'icon-180.png'), path.join(publicDir, 'apple-touch-icon.png'))

console.log('Brand assets generated successfully.')
