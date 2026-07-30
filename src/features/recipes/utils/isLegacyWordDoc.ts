export function isLegacyWordDoc(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.doc') && !fileName.toLowerCase().endsWith('.docx')
}
