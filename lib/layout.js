// Toda a matematica de layout vive aqui, em milimetros.
// O preview (SVG) e o PDF (jsPDF) consomem exatamente o mesmo resultado,
// entao o que aparece na tela e o que sai na folha.

export const PAGE_FORMATS = {
  a4: { label: 'A4 — 210 × 297 mm', width: 210, height: 297 },
  a5: { label: 'A5 — 148 × 210 mm', width: 148, height: 210 },
  a3: { label: 'A3 — 297 × 420 mm', width: 297, height: 420 },
  letter: { label: 'Carta — 216 × 279 mm', width: 215.9, height: 279.4 },
  legal: { label: 'Ofício — 216 × 356 mm', width: 215.9, height: 355.6 },
};

export const CUT_STYLES = {
  grid: 'Linhas de corte',
  box: 'Moldura em cada QR',
  none: 'Sem guias',
};

const PT_TO_MM = 25.4 / 72;

/** Dimensoes da folha ja considerando a orientacao. */
export function getPageSize(format, orientation) {
  const base = PAGE_FORMATS[format] || PAGE_FORMATS.a4;
  return orientation === 'landscape'
    ? { width: base.height, height: base.width }
    : { width: base.width, height: base.height };
}

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/** Largura aproximada de um texto em Helvetica, em mm. */
function textWidthMm(text, fontPt) {
  return text.length * fontPt * PT_TO_MM * 0.5;
}

/** Corta o rotulo com reticencias para caber na largura da celula. */
export function fitLabel(text, fontPt, maxWidthMm) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (textWidthMm(clean, fontPt) <= maxWidthMm) return clean;
  const perChar = fontPt * PT_TO_MM * 0.5;
  const max = Math.floor(maxWidthMm / perChar) - 1;
  if (max <= 1) return '';
  return clean.slice(0, max) + '…';
}

/**
 * Monta a grade e distribui os conteudos pelas paginas.
 *
 * @param {object} o
 * @param {string[]} o.contents  um item por QR code, na ordem de impressao
 * @returns layout pronto para desenhar
 */
export function computeLayout({
  contents,
  format = 'a4',
  orientation = 'portrait',
  cols = 3,
  rows = 4,
  margin = 10,
  gap = 0,
  showLabels = false,
  labelSize = 7,
  cutStyle = 'grid',
}) {
  const page = getPageSize(format, orientation);

  cols = clamp(Math.round(cols), 1, 20);
  rows = clamp(Math.round(rows), 1, 20);
  margin = clamp(margin, 0, Math.min(page.width, page.height) / 2 - 5);
  gap = clamp(gap, 0, 30);

  const usableW = page.width - margin * 2;
  const usableH = page.height - margin * 2;

  const cellW = (usableW - gap * (cols - 1)) / cols;
  const cellH = (usableH - gap * (rows - 1)) / rows;

  // Espaco reservado para o rotulo abaixo do QR (altura da linha ~1.5x).
  const labelH = showLabels ? labelSize * PT_TO_MM * 1.5 : 0;

  // Respiro interno para o QR nao encostar na linha de corte (quiet zone).
  const padding = Math.min(1.5, cellW * 0.06, cellH * 0.06);

  const qrSize = Math.max(0, Math.min(cellW - padding * 2, cellH - labelH - padding * 2));
  const perPage = cols * rows;
  const total = contents.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));

  const pages = [];
  for (let p = 0; p < pageCount; p++) {
    const cells = [];
    for (let i = 0; i < perPage; i++) {
      const index = p * perPage + i;
      if (index >= total) break;

      const c = i % cols;
      const r = Math.floor(i / cols);
      const cellX = margin + c * (cellW + gap);
      const cellY = margin + r * (cellH + gap);
      const content = contents[index];

      cells.push({
        index,
        content,
        cellX,
        cellY,
        x: cellX + (cellW - qrSize) / 2,
        y: cellY + (cellH - labelH - qrSize) / 2,
        size: qrSize,
        label: showLabels ? fitLabel(content, labelSize, cellW - padding * 2) : '',
        // linha de base do texto, logo abaixo do QR
        labelY: cellY + (cellH - labelH - qrSize) / 2 + qrSize + labelH * 0.78,
        labelX: cellX + cellW / 2,
      });
    }
    pages.push(cells);
  }

  return {
    page,
    cols,
    rows,
    margin,
    gap,
    cellW,
    cellH,
    qrSize,
    labelH,
    labelSize,
    perPage,
    total,
    pageCount,
    pages,
    cutStyle,
    cutLines: cutStyle === 'grid' ? buildCutLines({ page, margin, cols, rows, cellW, cellH, gap }) : [],
  };
}

/** Linhas de corte que atravessam a folha inteira, no meio de cada calha. */
function buildCutLines({ page, margin, cols, rows, cellW, cellH, gap }) {
  const lines = [];
  const xs = [margin, margin + cols * cellW + (cols - 1) * gap];
  for (let c = 1; c < cols; c++) xs.push(margin + c * (cellW + gap) - gap / 2);

  const ys = [margin, margin + rows * cellH + (rows - 1) * gap];
  for (let r = 1; r < rows; r++) ys.push(margin + r * (cellH + gap) - gap / 2);

  for (const x of xs) lines.push({ x1: x, y1: 0, x2: x, y2: page.height });
  for (const y of ys) lines.push({ x1: 0, y1: y, x2: page.width, y2: y });
  return lines;
}

/**
 * Expande os campos do formulario na lista final de conteudos (um por QR).
 * - modo "single": o mesmo texto repetido N vezes
 * - modo "list": uma linha por item, cada um repetido N vezes (agrupado)
 */
export function buildContents({ mode, text, list, quantity, copies }) {
  if (mode === 'list') {
    const items = String(list || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const n = clamp(Math.round(copies) || 1, 1, 500);
    const out = [];
    for (const item of items) {
      for (let i = 0; i < n; i++) out.push(item);
      if (out.length >= 2000) break;
    }
    return out.slice(0, 2000);
  }

  const value = String(text || '').trim();
  if (!value) return [];
  const n = clamp(Math.round(quantity) || 1, 1, 2000);
  return Array.from({ length: n }, () => value);
}
