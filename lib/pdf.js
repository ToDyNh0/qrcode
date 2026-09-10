import { getQrMap, pixelsForPrint } from './qr';

const CUT_COLOR = 165;

/**
 * Monta o PDF inteiro no browser. Nada sai da maquina do usuario.
 * @returns {Promise<import('jspdf').jsPDF>}
 */
export async function buildPdf(layout, { ecc = 'M', quietZone = 2 } = {}) {
  const { jsPDF } = await import('jspdf');

  const { page, cutStyle, labelSize } = layout;
  const isLandscape = page.width > page.height;
  const portraitFormat = [
    Math.min(page.width, page.height),
    Math.max(page.width, page.height),
  ];

  const doc = new jsPDF({
    unit: 'mm',
    format: portraitFormat,
    orientation: isLandscape ? 'landscape' : 'portrait',
    compress: true,
  });

  doc.setProperties({ title: 'QR Code Grid', creator: 'QR Code Grid' });

  // Uma imagem por conteudo unico, em resolucao de impressao.
  const contents = layout.pages.flat().map((c) => c.content);
  const px = pixelsForPrint(layout.qrSize);
  const qrMap = await getQrMap(contents, { size: px, ecc, margin: quietZone });

  const aliasOf = new Map();
  [...qrMap.keys()].forEach((content, i) => aliasOf.set(content, `qr-${i}`));

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30);

  layout.pages.forEach((cells, pageIndex) => {
    if (pageIndex > 0) doc.addPage(portraitFormat, isLandscape ? 'landscape' : 'portrait');

    drawCutMarks(doc, layout, cells);

    for (const cell of cells) {
      if (cell.size <= 0) continue;
      doc.addImage(
        qrMap.get(cell.content),
        'PNG',
        cell.x,
        cell.y,
        cell.size,
        cell.size,
        aliasOf.get(cell.content), // alias: a imagem e embutida uma unica vez
        'FAST'
      );

      if (cell.label) {
        doc.setFontSize(labelSize);
        doc.text(cell.label, cell.labelX, cell.labelY, { align: 'center' });
      }
    }
  });

  return doc;
}

function drawCutMarks(doc, layout, cells) {
  if (layout.cutStyle === 'none') return;

  doc.setDrawColor(CUT_COLOR);
  doc.setLineWidth(0.1);
  doc.setLineDashPattern([1, 1], 0);

  if (layout.cutStyle === 'grid') {
    for (const l of layout.cutLines) doc.line(l.x1, l.y1, l.x2, l.y2);
  } else if (layout.cutStyle === 'box') {
    for (const cell of cells) {
      doc.rect(cell.cellX, cell.cellY, layout.cellW, layout.cellH);
    }
  }

  doc.setLineDashPattern([], 0);
}

export function suggestFileName(contents) {
  const first = contents[0] || 'qr';
  const slug = first
    .normalize('NFD') // separa o acento da letra...
    .replace(/[^\x20-\x7E]/g, '') // ...e descarta o acento solto, mantendo "acao" em vez de "a-o"
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 32);
  return `qr-grid-${slug || 'codes'}.pdf`;
}
