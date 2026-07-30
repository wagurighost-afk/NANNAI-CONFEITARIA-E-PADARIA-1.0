import type { PopDocument } from '@/features/pop/types/pop.types'

export const POP_MOCK: PopDocument[] = [
  {
    id: 'pop-001',
    title: 'Higienização de bancadas',
    sector: 'Confeitaria',
    version: '2.1',
    summary: 'Procedimento de limpeza e sanitização das bancadas de produção.',
    content:
      '1. Remover resíduos sólidos.\n2. Aplicar detergente neutro.\n3. Enxaguar com água potável.\n4. Sanitizar com solução aprovada.\n5. Registrar no checklist de abertura.',
    updatedAt: '2026-06-15T00:00:00.000Z',
  },
  {
    id: 'pop-002',
    title: 'Etiquetagem de validade',
    sector: 'Confeitaria',
    version: '1.4',
    summary: 'Padrão de etiquetas e registro de validade dos produtos.',
    content:
      'Toda produção deve ser etiquetada com data de fabricação, validade e responsável. Conferir diariamente a praça de exposição.',
    updatedAt: '2026-05-20T00:00:00.000Z',
  },
  {
    id: 'pop-003',
    title: 'Abertura da padaria',
    sector: 'Padaria',
    version: '3.0',
    summary: 'Checklist de abertura do setor de padaria.',
    content:
      'Ligar fornos, conferir fermentação, verificar estoque de insumos críticos e alinhar produção com escala do dia.',
    updatedAt: '2026-07-01T00:00:00.000Z',
  },
]
