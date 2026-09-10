import QRCode from 'qrcode';

// Conteudos iguais geram a mesma imagem: guardamos a promise para nao
// recalcular nem disparar duas vezes o mesmo trabalho.
const cache = new Map();

export function qrKey(text, ecc, margin, size) {
  return `${ecc}|${margin}|${size}|${text}`;
}

export function getQrDataUrl(text, { size = 320, ecc = 'M', margin = 2 } = {}) {
  const key = qrKey(text, ecc, margin, size);
  const hit = cache.get(key);
  if (hit) return hit;

  const promise = QRCode.toDataURL(text, {
    errorCorrectionLevel: ecc,
    margin,
    width: size,
    color: { dark: '#000000', light: '#ffffff' },
  }).catch((err) => {
    cache.delete(key);
    throw err;
  });

  cache.set(key, promise);
  return promise;
}

/** Gera (em paralelo) o mapa conteudo -> dataURL para uma lista de textos unicos. */
export async function getQrMap(texts, options) {
  const unique = [...new Set(texts)];
  const entries = await Promise.all(
    unique.map(async (t) => [t, await getQrDataUrl(t, options)])
  );
  return new Map(entries);
}

/**
 * Resolucao da imagem a partir do tamanho impresso.
 * ~600 dpi mantem o QR nitido em qualquer impressora domestica.
 */
export function pixelsForPrint(sizeMm, dpi = 600) {
  const px = Math.round((sizeMm / 25.4) * dpi);
  return Math.max(160, Math.min(1400, px));
}
