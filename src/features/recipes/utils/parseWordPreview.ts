export interface WordPreviewData {
  html: string
}

export async function parseWordBlob(blob: Blob): Promise<WordPreviewData> {
  const mammoth = await import('mammoth')
  const buffer = await blob.arrayBuffer()
  const result = await mammoth.convertToHtml({ arrayBuffer: buffer })
  const html = result.value.trim()

  if (!html) {
    throw new Error('O documento Word está vazio ou não pôde ser lido.')
  }

  return { html }
}
