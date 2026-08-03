import { NANNAI_INSIGHTS_SECTIONS } from './sections.js'
import type { NannaiInsightsOverview } from './types.js'

const MODULE_VERSION = '0.1.0-scaffold'

export function getNannaiInsightsOverview(): NannaiInsightsOverview {
  return {
    module: 'nannai-insights',
    version: MODULE_VERSION,
    status: 'scaffold',
    generatedAt: new Date().toISOString(),
    sections: NANNAI_INSIGHTS_SECTIONS.map((section) => ({
      ...section,
      placeholders: section.placeholders.map((card) => ({ ...card })),
    })),
  }
}
