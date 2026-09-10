'use client';

import { useEffect, useId, useState } from 'react';
import { clamp } from '@/lib/layout';

/**
 * Campo numerico que deixa o usuario apagar o conteudo enquanto digita
 * e so devolve valores validos (ja limitados) para o estado.
 */
export function NumberField({ label, value, min, max, step = 1, suffix, onChange }) {
  const id = useId();
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  function handleChange(e) {
    const raw = e.target.value;
    setText(raw);
    const n = Number(raw);
    if (raw !== '' && Number.isFinite(n)) onChange(clamp(n, min, max));
  }

  return (
    <div className="field">
      <label htmlFor={id}>
        <span>{label}</span>
        {suffix ? <span className="field-value">{suffix}</span> : null}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={text}
        onChange={handleChange}
        onBlur={() => setText(String(value))}
      />
    </div>
  );
}

export function RangeField({ label, value, min, max, step = 1, unit = '', onChange }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>
        <span>{label}</span>
        <span className="field-value">
          {value}
          {unit}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function SelectField({ label, value, options, onChange }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="select-wrap">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function Switch({ label, checked, onChange }) {
  return (
    <label className="switch">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function Tabs({ value, options, onChange, ariaLabel }) {
  return (
    <div className="tabs" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
