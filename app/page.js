'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ControlPanel from '@/components/ControlPanel';
import SheetPreview from '@/components/SheetPreview';
import { useDebounced } from '@/lib/useDebounced';
import { buildContents, computeLayout } from '@/lib/layout';
import { getQrMap } from '@/lib/qr';
import { buildPdf, suggestFileName } from '@/lib/pdf';

const QUIET_ZONE = 2; // modulos brancos em volta do QR, para leitura confiavel

const INITIAL = {
  mode: 'single',
  text: 'https://exemplo.com',
  list: '',
  quantity: 12,
  copies: 1,
  cols: 3,
  rows: 4,
  format: 'a4',
  orientation: 'portrait',
  margin: 10,
  gap: 0,
  cutStyle: 'grid',
  ecc: 'M',
  showLabels: false,
};

export default function Home() {
  const [s, setS] = useState(INITIAL);
  const [qrMap, setQrMap] = useState(() => new Map());
  const [pageIndex, setPageIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = useCallback((patch) => setS((prev) => ({ ...prev, ...patch })), []);

  // O texto e debounced so para nao gerar QR a cada tecla; a grade responde na hora.
  const text = useDebounced(s.text, 130);
  const list = useDebounced(s.list, 200);

  const contents = useMemo(
    () => buildContents({ mode: s.mode, text, list, quantity: s.quantity, copies: s.copies }),
    [s.mode, text, list, s.quantity, s.copies]
  );

  const layout = useMemo(
    () =>
      computeLayout({
        contents,
        format: s.format,
        orientation: s.orientation,
        cols: s.cols,
        rows: s.rows,
        margin: s.margin,
        gap: s.gap,
        cutStyle: s.cutStyle,
        showLabels: s.showLabels,
        labelSize: 7,
      }),
    [contents, s.format, s.orientation, s.cols, s.rows, s.margin, s.gap, s.cutStyle, s.showLabels]
  );

  const unique = useMemo(() => [...new Set(contents)], [contents]);
  // Itens de lista nunca contem quebra de linha, entao "\n" e um separador seguro
  // para transformar o conjunto de textos em uma dependencia estavel do efeito.
  const uniqueKey = useMemo(() => unique.join('\n'), [unique]);

  // Gera as imagens do preview (resolucao de tela) sempre que o conteudo muda.
  useEffect(() => {
    let cancelled = false;
    if (!unique.length) {
      setQrMap(new Map());
      return;
    }
    getQrMap(unique, { size: 320, ecc: s.ecc, margin: QUIET_ZONE })
      .then((map) => {
        if (!cancelled) {
          setQrMap(map);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Esse texto é longo demais para caber em um QR code.');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueKey, s.ecc]);

  useEffect(() => {
    setPageIndex((i) => Math.min(i, layout.pageCount - 1));
  }, [layout.pageCount]);

  const isEmpty = contents.length === 0;

  async function handleDownload() {
    if (isEmpty || busy) return;
    setBusy(true);
    setError(null);
    try {
      const doc = await buildPdf(layout, { ecc: s.ecc, quietZone: QUIET_ZONE });
      doc.save(suggestFileName(contents));
    } catch (err) {
      console.error(err);
      setError('Não foi possível gerar o PDF. Reduza a quantidade ou o tamanho do texto.');
    } finally {
      setBusy(false);
    }
  }

  const qrSizeLabel = layout.qrSize > 0 ? layout.qrSize.toFixed(1) + ' mm' : '-';
  const sheetWord = layout.pageCount > 1 ? 'folhas' : 'folha';

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <main className="shell">
        <header className="masthead">
          <div className="brand">
            <span className="mark" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm9-2h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zm11-2h2v2h-2v-2zm3 0h2v2h-2v-2zm-3 3h2v2h-2v-2zm3 3h2v2h-2v-2zm-3 0h2v2h-2v-2z" />
                <rect className="mark-spot" x="19" y="17" width="2" height="2" />
              </svg>
            </span>
            <div>
              <h1 className="wordmark">QR Code Grid</h1>
              <p className="strapline">Gerador de folhas para recorte</p>
            </div>
          </div>
          <div className="specs">
            <span>
              <span className="tick" aria-hidden="true" />
              Roda no navegador
            </span>
            <span>Sem upload</span>
            <span>Escala 1:1</span>
          </div>
        </header>

        <div className="workspace">
          <ControlPanel s={s} set={set} />

          <div className="preview-col">
            <section className="card">
              <div className="card-head">
                <div className="card-title">
                  <h2>Prévia da folha</h2>
                </div>
                {layout.pageCount > 1 && (
                  <div className="pager">
                    <button
                      type="button"
                      className="btn btn-step"
                      onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                      disabled={pageIndex === 0}
                      aria-label="Página anterior"
                    >
                      &#8249;
                    </button>
                    <span>
                      {pageIndex + 1} / {layout.pageCount}
                    </span>
                    <button
                      type="button"
                      className="btn btn-step"
                      onClick={() => setPageIndex((i) => Math.min(layout.pageCount - 1, i + 1))}
                      disabled={pageIndex >= layout.pageCount - 1}
                      aria-label="Próxima página"
                    >
                      &#8250;
                    </button>
                  </div>
                )}
              </div>

              <dl className="summary">
                <div>
                  <dt>QR codes</dt>
                  <dd>{layout.total}</dd>
                </div>
                <div>
                  <dt>Por folha</dt>
                  <dd>{layout.perPage}</dd>
                </div>
                <div>
                  <dt>Folhas</dt>
                  <dd>{isEmpty ? 0 : layout.pageCount}</dd>
                </div>
                <div>
                  <dt>Tamanho</dt>
                  <dd>{qrSizeLabel}</dd>
                </div>
              </dl>

              <div className="stage">
                {isEmpty ? (
                  <div className="empty">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm9-2h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zm9-2h3v3h-3v-3zm5 0h2v2h-2v-2zm-5 5h3v3h-3v-3zm5 0h2v3h-2v-3z" />
                    </svg>
                    <p>Aguardando conteúdo</p>
                  </div>
                ) : (
                  <div className="paper-holder">
                    <SheetPreview layout={layout} qrMap={qrMap} pageIndex={pageIndex} />
                  </div>
                )}
              </div>
            </section>

            <section className="card download-card">
              <div className="card-body">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleDownload}
                  disabled={isEmpty || busy}
                >
                  {busy ? (
                    <>
                      <span className="spinner" aria-hidden="true" /> Gerando PDF…
                    </>
                  ) : (
                    <>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3a1 1 0 0 1 1 1v8.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4l2.3 2.3V4a1 1 0 0 1 1-1zM5 18a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1z" />
                      </svg>
                      Baixar PDF
                      {!isEmpty && (
                        <span className="btn-count">
                          {layout.pageCount} {sheetWord}
                        </span>
                      )}
                    </>
                  )}
                </button>
                {error && <p className="error">{error}</p>}
                <p className="hint">
                  Imprima em escala 100% (sem &ldquo;ajustar à página&rdquo;) para o tamanho sair
                  exato.
                </p>
              </div>
            </section>
          </div>
        </div>

        <footer className="colophon">
          <p className="credit">
            feito por <strong>Naibu</strong> pra ajudar voces no projeto de extenção{' '}
            <span className="heart">&lt;3</span>
          </p>
          <p className="footnote">Nada sai deste dispositivo</p>
        </footer>
      </main>
    </>
  );
}
