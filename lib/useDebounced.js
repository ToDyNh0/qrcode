'use client';

import { useEffect, useState } from 'react';

/** Atrasa a propagacao de um valor — usado para nao gerar QR a cada tecla. */
export function useDebounced(value, delay = 150) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
