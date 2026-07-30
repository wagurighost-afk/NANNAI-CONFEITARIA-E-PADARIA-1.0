import { POP_MOCK } from '@/features/pop/mocks/pop.mock'
import type { PopDocument } from '@/features/pop/types/pop.types'

function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export const popService = {
  async list(): Promise<PopDocument[]> {
    await delay()
    return POP_MOCK
  },
  async getById(id: string): Promise<PopDocument | null> {
    await delay()
    return POP_MOCK.find((doc) => doc.id === id) ?? null
  },
}
