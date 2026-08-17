import type {
  RequisitionRecord,
  RequisitionStatus,
} from '@/features/requisition/types/requisition.types'

const PAGE_LEFT = 14
const PAGE_RIGHT = 196
const PAGE_BOTTOM = 280

const STATUS_LABELS: Record<RequisitionStatus, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviada',
  IN_REVIEW: 'Em revisão',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  FULFILLED: 'Atendida',
  FINALIZED: 'Finalizada',
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Recife',
  }).format(new Date(value))
}

async function buildRequisitionPdf(
  record: RequisitionRecord,
) {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const number =
    record.requisitionNumber ??
    `REQ-LEGADO-${record.id.slice(-8).toUpperCase()}`

  let y = 16

  const ensureSpace = (height: number) => {
    if (y + height <= PAGE_BOTTOM) {
      return
    }

    doc.addPage()
    y = 16
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text('NANNAI Food Operations', PAGE_LEFT, y)

  y += 8

  doc.setFontSize(14)
  doc.text(`Requisição ${number}`, PAGE_LEFT, y)

  y += 9

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  doc.text(
    `Setor: ${
      record.sector === 'CONFEITARIA'
        ? 'Confeitaria'
        : 'Padaria'
    }`,
    PAGE_LEFT,
    y,
  )

  y += 5
  doc.text(
    `Responsável: ${record.responsible.name}`,
    PAGE_LEFT,
    y,
  )

  y += 5
  doc.text(
    `Status: ${STATUS_LABELS[record.status]}`,
    PAGE_LEFT,
    y,
  )

  y += 5
  doc.text(
    `Criada em: ${formatDateTime(record.createdAt)}`,
    PAGE_LEFT,
    y,
  )

  y += 8

  doc.line(PAGE_LEFT, y, PAGE_RIGHT, y)
  y += 7

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Itens solicitados', PAGE_LEFT, y)

  y += 7

  const requestedItems = record.items.filter(
    (item) => item.requestedQuantity > 0,
  )

  const drawHeader = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)

    doc.text('Item', PAGE_LEFT, y)
    doc.text('Atual', 104, y)
    doc.text('Mín.', 127, y)
    doc.text('Máx.', 148, y)
    doc.text('Solicitado', 169, y)

    y += 3
    doc.line(PAGE_LEFT, y, PAGE_RIGHT, y)
    y += 5
  }

  drawHeader()

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)

  for (const item of requestedItems) {
    const itemLabel = `${item.name} (${item.unit})`
    const lines = doc.splitTextToSize(itemLabel, 82)
    const rowHeight = Math.max(6, lines.length * 4)

    if (y + rowHeight > PAGE_BOTTOM) {
      doc.addPage()
      y = 16
      drawHeader()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
    }

    doc.text(lines, PAGE_LEFT, y)

    doc.text(
      formatQuantity(item.currentStock),
      104,
      y,
    )

    doc.text(
      formatQuantity(item.minimumStock),
      127,
      y,
    )

    doc.text(
      formatQuantity(item.maximumStock),
      148,
      y,
    )

    doc.setFont('helvetica', 'bold')

    doc.text(
      `${formatQuantity(item.requestedQuantity)} ${item.unit}`,
      169,
      y,
    )

    doc.setFont('helvetica', 'normal')

    y += rowHeight
  }

  if (requestedItems.length === 0) {
    doc.text(
      'Nenhum item com quantidade solicitada.',
      PAGE_LEFT,
      y,
    )

    y += 7
  }

  ensureSpace(18)

  y += 3
  doc.line(PAGE_LEFT, y, PAGE_RIGHT, y)
  y += 7

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Histórico', PAGE_LEFT, y)

  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)

  for (const entry of record.history ?? []) {
    const description =
      `${formatDateTime(entry.at)} - ${entry.userName} - ` +
      `${STATUS_LABELS[entry.toStatus]}`

    const lines = doc.splitTextToSize(
      description,
      PAGE_RIGHT - PAGE_LEFT,
    )

    const noteLines = entry.note
      ? doc.splitTextToSize(
          `Observação: ${entry.note}`,
          PAGE_RIGHT - PAGE_LEFT - 4,
        )
      : []

    const blockHeight =
      lines.length * 4 +
      noteLines.length * 4 +
      3

    ensureSpace(blockHeight)

    doc.text(lines, PAGE_LEFT, y)
    y += lines.length * 4

    if (noteLines.length > 0) {
      doc.text(noteLines, PAGE_LEFT + 4, y)
      y += noteLines.length * 4
    }

    y += 3
  }

  const pageCount = doc.getNumberOfPages()

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)

    doc.text(
      `${number} • Página ${page}/${pageCount}`,
      PAGE_LEFT,
      292,
    )
  }

  return {
    doc,
    number,
  }
}
export async function downloadRequisitionPdf(
  record: RequisitionRecord,
): Promise<void> {
  const { doc, number } = await buildRequisitionPdf(record)

  doc.save(`${number}.pdf`)
}

export type RequisitionShareResult =
  | 'shared'
  | 'downloaded'
  | 'cancelled'

export async function shareRequisitionPdf(
  record: RequisitionRecord,
): Promise<RequisitionShareResult> {
  const { doc, number } = await buildRequisitionPdf(record)

  const blob = doc.output('blob')

  const file = new File(
    [blob],
    `${number}.pdf`,
    {
      type: 'application/pdf',
    },
  )

  const supportsFileShare =
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({
      files: [file],
    })

  if (!supportsFileShare) {
    doc.save(`${number}.pdf`)
    return 'downloaded'
  }

  try {
    await navigator.share({
      title: `Requisição ${number}`,
      text: `Requisição ${number} - NANNAI Food Operations`,
      files: [file],
    })

    return 'shared'
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'AbortError'
    ) {
      return 'cancelled'
    }

    throw error
  }
}