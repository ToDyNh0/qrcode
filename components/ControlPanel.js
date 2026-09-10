'use client';

import { NumberField, RangeField, SelectField, Switch, Tabs } from './Fields';
import { CUT_STYLES, PAGE_FORMATS } from '@/lib/layout';

const GRID_PRESETS = [
  [2, 2],
  [3, 3],
  [3, 4],
  [4, 4],
  [4, 6],
  [5, 5],
];

const FORMAT_OPTIONS = Object.entries(PAGE_FORMATS).map(([value, f]) => ({
  value,
  label: f.label,
}));

const CUT_OPTIONS = Object.entries(CUT_STYLES).map(([value, label]) => ({ value, label }));

const ECC_OPTIONS = [
  { value: 'L', label: 'Baixa — 7% (QR menor)' },
  { value: 'M', label: 'Média — 15% (padrão)' },
  { value: 'Q', label: 'Alta — 25%' },
  { value: 'H', label: 'Máxima — 30%' },
];

export default function ControlPanel({ s, set }) {
  return (
    <div className="controls-col">
      <section className="card">
        <div className="card-head">
          <div className="card-title">
            <span className="step" aria-hidden="true">
              01
            </span>
            <h2>Conteúdo</h2>
          </div>
        </div>
        <div className="card-body">
          <Tabs
            ariaLabel="Modo de conteúdo"
            value={s.mode}
            onChange={(mode) => set({ mode })}
            options={[
              { value: 'single', label: 'Um texto' },
              { value: 'list', label: 'Vários (lista)' },
            ]}
          />

          {s.mode === 'single' ? (
            <>
              <div className="field">
                <label htmlFor="content">Texto ou link do QR code</label>
                <textarea
                  id="content"
                  value={s.text}
                  onChange={(e) => set({ text: e.target.value })}
                  placeholder="https://exemplo.com&#10;ou qualquer texto"
                  spellCheck={false}
                />
              </div>
              <NumberField
                label="Quantidade de QR codes"
                value={s.quantity}
                min={1}
                max={2000}
                onChange={(quantity) => set({ quantity })}
              />
            </>
          ) : (
            <>
              <div className="field">
                <label htmlFor="list">Um conteúdo por linha</label>
                <textarea
                  id="list"
                  value={s.list}
                  onChange={(e) => set({ list: e.target.value })}
                  placeholder={'https://exemplo.com/1\nhttps://exemplo.com/2\nMESA-01'}
                  spellCheck={false}
                  style={{ minHeight: 130 }}
                />
                <span className="hint">Cada linha vira um QR code diferente.</span>
              </div>
              <NumberField
                label="Cópias de cada linha"
                value={s.copies}
                min={1}
                max={500}
                onChange={(copies) => set({ copies })}
              />
            </>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div className="card-title">
            <span className="step" aria-hidden="true">
              02
            </span>
            <h2>Grade</h2>
          </div>
        </div>
        <div className="card-body">
          <div className="field">
            <span className="field-label">Atalhos (colunas × linhas)</span>
            <div className="chips">
              {GRID_PRESETS.map(([c, r]) => (
                <button
                  key={`${c}x${r}`}
                  type="button"
                  className="chip"
                  aria-pressed={s.cols === c && s.rows === r}
                  onClick={() => set({ cols: c, rows: r })}
                >
                  {c}×{r}
                </button>
              ))}
            </div>
          </div>

          <div className="row">
            <NumberField
              label="Colunas"
              value={s.cols}
              min={1}
              max={20}
              onChange={(cols) => set({ cols })}
            />
            <NumberField
              label="Linhas"
              value={s.rows}
              min={1}
              max={20}
              onChange={(rows) => set({ rows })}
            />
          </div>

          <RangeField
            label="Margem da folha"
            value={s.margin}
            min={0}
            max={30}
            step={1}
            unit=" mm"
            onChange={(margin) => set({ margin })}
          />
          <RangeField
            label="Espaço entre QR codes"
            value={s.gap}
            min={0}
            max={20}
            step={1}
            unit=" mm"
            onChange={(gap) => set({ gap })}
          />
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div className="card-title">
            <span className="step" aria-hidden="true">
              03
            </span>
            <h2>Folha e impressão</h2>
          </div>
        </div>
        <div className="card-body">
          <SelectField
            label="Tamanho do papel"
            value={s.format}
            options={FORMAT_OPTIONS}
            onChange={(format) => set({ format })}
          />
          <Tabs
            ariaLabel="Orientação"
            value={s.orientation}
            onChange={(orientation) => set({ orientation })}
            options={[
              { value: 'portrait', label: 'Retrato' },
              { value: 'landscape', label: 'Paisagem' },
            ]}
          />
          <SelectField
            label="Guias de recorte"
            value={s.cutStyle}
            options={CUT_OPTIONS}
            onChange={(cutStyle) => set({ cutStyle })}
          />
          <SelectField
            label="Correção de erro"
            value={s.ecc}
            options={ECC_OPTIONS}
            onChange={(ecc) => set({ ecc })}
          />
          <Switch
            label="Escrever o conteúdo abaixo do QR"
            checked={s.showLabels}
            onChange={(showLabels) => set({ showLabels })}
          />
        </div>
      </section>
    </div>
  );
}
