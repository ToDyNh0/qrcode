'use client';

// Preview em SVG usando o mesmo sistema de coordenadas do PDF (milimetros),
// entao a folha na tela e literalmente a folha impressa.
export default function SheetPreview({ layout, qrMap, pageIndex }) {
  const { page } = layout;
  const cells = layout.pages[pageIndex] || [];
  const ratio = page.width / page.height;

  return (
    <svg
      className="sheet"
      viewBox={`0 0 ${page.width} ${page.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: `min(560px, calc(72vh * ${ratio}))` }}
      role="img"
      aria-label={`Prévia da página ${pageIndex + 1} com ${cells.length} QR codes`}
    >
      <rect x="0" y="0" width={page.width} height={page.height} fill="#ffffff" />

      {layout.cutStyle === 'grid' &&
        layout.cutLines.map((l, i) => (
          <line
            key={`cut-${i}`}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="#a5a5a5"
            strokeWidth="0.2"
            strokeDasharray="1 1"
          />
        ))}

      {layout.cutStyle === 'box' &&
        cells.map((c) => (
          <rect
            key={`box-${c.index}`}
            x={c.cellX}
            y={c.cellY}
            width={layout.cellW}
            height={layout.cellH}
            fill="none"
            stroke="#a5a5a5"
            strokeWidth="0.2"
            strokeDasharray="1 1"
          />
        ))}

      {cells.map((c) => {
        const src = qrMap.get(c.content);
        return src ? (
          <image
            key={c.index}
            href={src}
            x={c.x}
            y={c.y}
            width={c.size}
            height={c.size}
            preserveAspectRatio="none"
          />
        ) : (
          <rect
            key={c.index}
            x={c.x}
            y={c.y}
            width={c.size}
            height={c.size}
            fill="#eceef1"
            rx={c.size * 0.04}
          />
        );
      })}

      {cells.map((c) =>
        c.label ? (
          <text
            key={`label-${c.index}`}
            x={c.labelX}
            y={c.labelY}
            fontSize={layout.labelSize * (25.4 / 72)}
            fontFamily="Helvetica, Arial, sans-serif"
            textAnchor="middle"
            fill="#1e1e1e"
          >
            {c.label}
          </text>
        ) : null
      )}
    </svg>
  );
}
