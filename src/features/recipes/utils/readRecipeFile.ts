/**
 * Converte arquivo para data URL (mock/local).
 * Na integração com API, substituir por upload multipart.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Não foi possível ler o arquivo.'))
    }
    reader.onerror = () => {
      reject(new Error('Falha ao ler o arquivo.'))
    }
    reader.readAsDataURL(file)
  })
}
