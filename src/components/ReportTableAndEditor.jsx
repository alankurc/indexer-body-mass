import React from 'react';
import { Edit3, Trash2, PlusCircle } from 'lucide-react';
import { enrichMeasurement } from '../utils/anthropometryMath.js';
import { normalizeDate } from '../utils/pdfParser.js';

function fmt(v, d = 1) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—';
  return Number(v).toFixed(d);
}

const REPORT_ROWS = [
  { section: 'Datos Básicos y Diámetros Óseos' },
  { key: 'peso', label: 'Peso', unit: 'kg', decimals: 1, ideal: 'down' },
  { key: 'talla', label: 'Talla', unit: 'cm', decimals: 1, ideal: 'neutral' },
  { key: 'humeral', label: 'Humeral (biepicondilar)', unit: 'cm', decimals: 1, ideal: 'neutral' },
  { key: 'femoral', label: 'Femoral (biepicondilar)', unit: 'cm', decimals: 1, ideal: 'neutral' },

  { section: 'Perímetros Corporales (cm)' },
  { key: 'brazoRelajado', label: 'Brazo Relajado', unit: 'cm', decimals: 1, ideal: 'up' },
  { key: 'brazoFlexionado', label: 'Brazo Flexionado en Tensión', unit: 'cm', decimals: 1, ideal: 'up' },
  { key: 'cintura', label: 'Cintura (mínima)', unit: 'cm', decimals: 1, ideal: 'down' },
  { key: 'caderas', label: 'Caderas (máxima)', unit: 'cm', decimals: 1, ideal: 'down' },
  { key: 'pantorrillaPerimetro', label: 'Pantorrilla (máxima)', unit: 'cm', decimals: 1, ideal: 'up' },

  { section: 'Pliegues Cutáneos ISAK Nivel 1 (mm)' },
  { key: 'triceps', label: 'Tríceps', unit: 'mm', decimals: 1, ideal: 'down' },
  { key: 'subescapular', label: 'Subescapular', unit: 'mm', decimals: 1, ideal: 'down' },
  { key: 'biceps', label: 'Bíceps', unit: 'mm', decimals: 1, ideal: 'down' },
  { key: 'crestaIliaca', label: 'Cresta Ilíaca', unit: 'mm', decimals: 1, ideal: 'down' },
  { key: 'supraespinal', label: 'Supraespinal', unit: 'mm', decimals: 1, ideal: 'down' },
  { key: 'abdominal', label: 'Abdominal', unit: 'mm', decimals: 1, ideal: 'down' },
  { key: 'musloMedial', label: 'Muslo (medial)', unit: 'mm', decimals: 1, ideal: 'down' },
  { key: 'pantorrillaPliegue', label: 'Pantorrilla', unit: 'mm', decimals: 1, ideal: 'down' },

  { section: 'Índices y Composición Corporal (Durnin & Womersley)' },
  { key: 'imc', label: 'IMC', unit: 'kg/m⁻²', decimals: 1, ideal: 'neutral', rowClass: 'highlight-yellow' },
  { key: 'indCintCad', label: 'IndCint/Cad', unit: '', decimals: 2, ideal: 'down', rowClass: 'highlight-yellow' },
  { key: 'suma6Pliegues', label: 'Suma 6 pl', unit: 'mm', decimals: 1, ideal: 'down', rowClass: 'highlight-yellow' },
  { key: 'suma8Pliegues', label: 'Suma 8 pl (ISAK)', unit: 'mm', decimals: 1, ideal: 'down', rowClass: 'highlight-yellow' },
  { key: 'grasaPctDurnin', label: '% graso (Durnin & W)', unit: '%', decimals: 1, ideal: 'down', rowClass: 'highlight-yellow' },
  { key: 'grasaKgDurnin', label: 'Grasa (Durnin & W)', unit: 'kg', decimals: 1, ideal: 'down', rowClass: 'highlight-yellow' },
  { key: 'magraKgDurnin', label: 'Magra (Durnin & W)', unit: 'kg', decimals: 1, ideal: 'up', rowClass: 'highlight-yellow' },

  { section: 'Fraccionamiento Deportivo (Yuhasz Atletas)' },
  { key: 'grasaPctYuhasz', label: '% graso Yuhasz (atletas)', unit: '%', decimals: 1, ideal: 'down', rowClass: 'highlight-terracotta' },
  { key: 'grasaKgYuhasz', label: 'Grasa Yuhasz', unit: 'kg', decimals: 1, ideal: 'down', rowClass: 'highlight-terracotta' },
  { key: 'magraKgYuhasz', label: 'Magra Yuhasz', unit: 'kg', decimals: 1, ideal: 'up', rowClass: 'highlight-terracotta' },
  { key: 'areaMuscBrazo', label: 'Area Musc Brazo', unit: 'mm²', decimals: 0, ideal: 'up' },

  { section: 'Somatotipo de Heath & Carter' },
  { key: 'endo', label: 'Endomorfia (ENDO)', unit: '', decimals: 1, ideal: 'down' },
  { key: 'meso', label: 'Mesomorfia (MESO)', unit: '', decimals: 1, ideal: 'up' },
  { key: 'ecto', label: 'Ectomorfia (ECTO)', unit: '', decimals: 1, ideal: 'up' },
  { key: 'somatoX', label: 'Coordenada X (ecto - endo)', unit: '', decimals: 2, ideal: 'neutral' },
  { key: 'somatoY', label: 'Coordenada Y (2×meso - (ecto + endo))', unit: '', decimals: 2, ideal: 'up' },
];

export function MeasurementModal({ initialRecord, onClose, onSave }) {
  const [form, setForm] = React.useState(() => ({
    fechaISO: initialRecord?.fechaISO || new Date().toISOString().slice(0, 10),
    numeroMedicion: initialRecord?.numeroMedicion ?? '',
    peso: initialRecord?.peso ?? '',
    talla: initialRecord?.talla ?? 189.9,
    humeral: initialRecord?.humeral ?? 7.1,
    femoral: initialRecord?.femoral ?? 10.2,
    brazoRelajado: initialRecord?.brazoRelajado ?? '',
    brazoFlexionado: initialRecord?.brazoFlexionado ?? '',
    cintura: initialRecord?.cintura ?? '',
    caderas: initialRecord?.caderas ?? '',
    pantorrillaPerimetro: initialRecord?.pantorrillaPerimetro ?? '',
    triceps: initialRecord?.triceps ?? '',
    subescapular: initialRecord?.subescapular ?? '',
    biceps: initialRecord?.biceps ?? '',
    crestaIliaca: initialRecord?.crestaIliaca ?? '',
    supraespinal: initialRecord?.supraespinal ?? '',
    abdominal: initialRecord?.abdominal ?? '',
    musloMedial: initialRecord?.musloMedial ?? '',
    pantorrillaPliegue: initialRecord?.pantorrillaPliegue ?? '',
    imc: initialRecord?.imc ?? '',
    indCintCad: initialRecord?.indCintCad ?? '',
    suma6Pliegues: initialRecord?.suma6Pliegues ?? '',
    grasaPctDurnin: initialRecord?.grasaPctDurnin ?? '',
    grasaKgDurnin: initialRecord?.grasaKgDurnin ?? '',
    magraKgDurnin: initialRecord?.magraKgDurnin ?? '',
    grasaPctYuhasz: initialRecord?.grasaPctYuhasz ?? '',
    grasaKgYuhasz: initialRecord?.grasaKgYuhasz ?? '',
    magraKgYuhasz: initialRecord?.magraKgYuhasz ?? '',
    areaMuscBrazo: initialRecord?.areaMuscBrazo ?? '',
    endo: initialRecord?.endo ?? '',
    meso: initialRecord?.meso ?? '',
    ecto: initialRecord?.ecto ?? '',
  }));

  const handleChange = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { fechaISO, fecha } = normalizeDate(form.fechaISO);
    const cleaned = {
      ...initialRecord,
      id: initialRecord?.id || `med-${fechaISO}`,
      fechaISO,
      fecha,
      origenArchivo: initialRecord?.origenArchivo || 'Carga Manual',
    };
    Object.keys(form).forEach((k) => {
      if (k === 'fechaISO') return;
      const v = form[k];
      cleaned[k] = v === '' || v === null || v === undefined ? null : Number(String(v).replace(',', '.'));
    });
    onSave(enrichMeasurement(cleaned));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="panel-title">
            {initialRecord ? `Editar Medición (${initialRecord.fecha})` : 'Nueva Medición Manual'}
          </h2>
          <button type="button" className="btn btn-sm btn-subtle" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Si dejas vacíos los campos calculados (IMC, Suma 6/8 pliegues, Yuhasz, Área Muscular de Brazo o
              Somatotipo), se calcularán automáticamente a partir de los pliegues, perímetros y peso.
            </p>

            <div>
              <div className="form-section-title">1. Fecha y Básicos</div>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="field-fecha">Fecha (YYYY-MM-DD)</label>
                  <input
                    id="field-fecha"
                    type="date"
                    required
                    value={form.fechaISO}
                    onChange={(e) => handleChange('fechaISO', e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="field-num">N° de Medición</label>
                  <input
                    id="field-num"
                    type="number"
                    step="1"
                    value={form.numeroMedicion}
                    onChange={(e) => handleChange('numeroMedicion', e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="field-peso">Peso (kg)</label>
                  <input
                    id="field-peso"
                    type="number"
                    step="0.1"
                    required
                    value={form.peso}
                    onChange={(e) => handleChange('peso', e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="field-talla">Talla (cm)</label>
                  <input
                    id="field-talla"
                    type="number"
                    step="0.1"
                    value={form.talla}
                    onChange={(e) => handleChange('talla', e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="field-humeral">Humeral (cm)</label>
                  <input
                    id="field-humeral"
                    type="number"
                    step="0.1"
                    value={form.humeral}
                    onChange={(e) => handleChange('humeral', e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="field-femoral">Femoral (cm)</label>
                  <input
                    id="field-femoral"
                    type="number"
                    step="0.1"
                    value={form.femoral}
                    onChange={(e) => handleChange('femoral', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="form-section-title">2. Perímetros Corporales (cm)</div>
              <div className="form-grid">
                {[
                  ['brazoRelajado', 'Brazo Relajado'],
                  ['brazoFlexionado', 'Brazo Flexionado en Tensión'],
                  ['cintura', 'Cintura (mínima)'],
                  ['caderas', 'Caderas (máxima)'],
                  ['pantorrillaPerimetro', 'Pantorrilla (máxima)'],
                ].map(([k, lbl]) => (
                  <div className="form-field" key={k}>
                    <label htmlFor={`field-${k}`}>{lbl}</label>
                    <input
                      id={`field-${k}`}
                      type="number"
                      step="0.1"
                      value={form[k]}
                      onChange={(e) => handleChange(k, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="form-section-title">3. Pliegues Cutáneos (mm)</div>
              <div className="form-grid">
                {[
                  ['triceps', 'Tríceps'],
                  ['subescapular', 'Subescapular'],
                  ['biceps', 'Bíceps'],
                  ['crestaIliaca', 'Cresta Ilíaca'],
                  ['supraespinal', 'Supraespinal'],
                  ['abdominal', 'Abdominal'],
                  ['musloMedial', 'Muslo (medial)'],
                  ['pantorrillaPliegue', 'Pantorrilla'],
                ].map(([k, lbl]) => (
                  <div className="form-field" key={k}>
                    <label htmlFor={`field-${k}`}>{lbl}</label>
                    <input
                      id={`field-${k}`}
                      type="number"
                      step="0.1"
                      value={form[k]}
                      onChange={(e) => handleChange(k, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="form-section-title">4. Índices, Durnin &amp; Womersley, Yuhasz y Somatotipo (Opcional)</div>
              <div className="form-grid">
                {[
                  ['grasaPctDurnin', '% Graso Durnin & W'],
                  ['grasaKgDurnin', 'Grasa D&W (kg)'],
                  ['magraKgDurnin', 'Magra D&W (kg)'],
                  ['grasaPctYuhasz', '% Graso Yuhasz'],
                  ['areaMuscBrazo', 'Área Musc. Brazo (mm²)'],
                  ['endo', 'Endomorfia'],
                  ['meso', 'Mesomorfia'],
                  ['ecto', 'Ectomorfia'],
                ].map(([k, lbl]) => (
                  <div className="form-field" key={k}>
                    <label htmlFor={`field-${k}`}>{lbl}</label>
                    <input
                      id={`field-${k}`}
                      type="number"
                      step="0.1"
                      value={form[k]}
                      onChange={(e) => handleChange(k, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-subtle" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" id="btn-save-measurement">
              Guardar Medición
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ReportTableAndEditor({
  data,
  baseRecord,
  currentRecord,
  onChangeBase,
  onChangeCurrent,
  onEditRecord,
  onDeleteRecord,
  onNewRecord,
}) {
  const base = baseRecord || data[0];
  const current = currentRecord || data[data.length - 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Clinical Sheet Side-by-Side Comparison */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Hoja Clínica Comparativa — Informe de Composición Corporal Nivel 1</h2>
            <p className="panel-subtitle">
              Estructura idéntica al informe PDF con cálculo directo de diferencias absolutas y relativas entre dos
              mediciones.
            </p>
          </div>
          <div className="control-group">
            <label htmlFor="report-base-select" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Medición A:
            </label>
            <select
              id="report-base-select"
              className="select-input"
              value={base?.id || ''}
              onChange={(e) => onChangeBase(e.target.value)}
            >
              {data.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fecha} {d.numeroMedicion ? `(#${d.numeroMedicion})` : ''}
                </option>
              ))}
            </select>

            <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>vs.</span>

            <label htmlFor="report-curr-select" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Medición B:
            </label>
            <select
              id="report-curr-select"
              className="select-input"
              value={current?.id || ''}
              onChange={(e) => onChangeCurrent(e.target.value)}
            >
              {data.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fecha} {d.numeroMedicion ? `(#${d.numeroMedicion})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-scroll">
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Variable Antropométrica</th>
                <th>Unidad</th>
                <th className="num">Medición A ({base?.fecha})</th>
                <th className="num">Medición B ({current?.fecha})</th>
                <th className="num">Diferencia (B - A)</th>
                <th className="num">% Variación</th>
              </tr>
            </thead>
            <tbody>
              {REPORT_ROWS.map((row, idx) => {
                if (row.section) {
                  return (
                    <tr key={`sec-${idx}`} className="section-row">
                      <td colSpan={6}>{row.section}</td>
                    </tr>
                  );
                }
                const vA = base?.[row.key];
                const vB = current?.[row.key];
                const diff = vA != null && vB != null ? vB - vA : null;
                const pct = vA != null && vB != null && vA !== 0 ? ((vB - vA) / Math.abs(vA)) * 100 : null;
                const isGood =
                  diff === null || Math.abs(diff) < 0.01
                    ? null
                    : row.ideal === 'down'
                      ? diff < 0
                      : row.ideal === 'up'
                        ? diff > 0
                        : null;

                return (
                  <tr key={row.key} className={row.rowClass || ''}>
                    <td style={{ fontWeight: 600 }}>{row.label}</td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}>
                      {row.unit}
                    </td>
                    <td className="num">{fmt(vA, row.decimals)}</td>
                    <td className="num" style={{ fontWeight: 700 }}>
                      {fmt(vB, row.decimals)}
                    </td>
                    <td
                      className="num"
                      style={{
                        fontWeight: 600,
                        color:
                          isGood === null
                            ? 'var(--text-secondary)'
                            : isGood
                              ? 'var(--accent-positive)'
                              : 'var(--accent-caution)',
                      }}
                    >
                      {diff !== null ? `${diff > 0 ? '+' : ''}${fmt(diff, row.decimals)}` : '—'}
                    </td>
                    <td className="num" style={{ color: 'var(--text-secondary)' }}>
                      {pct !== null ? `${pct > 0 ? '+' : ''}${fmt(pct, 1)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Registry Table with Edit & Delete */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Registro Histórico de Mediciones ({data.length})</h2>
            <p className="panel-subtitle">
              Puedes editar manualmente cualquier valor extraído o agregar nuevas mediciones sin PDF.
            </p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={onNewRecord} id="btn-new-manual-table">
            <PlusCircle size={15} />
            Agregar Medición Manual
          </button>
        </div>

        <div className="table-scroll" style={{ maxHeight: '460px' }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>N°</th>
                <th className="num">Peso (kg)</th>
                <th className="num">IMC</th>
                <th className="num">Cintura (cm)</th>
                <th className="num">Σ 6 Pl. (mm)</th>
                <th className="num">Σ 8 Pl. (mm)</th>
                <th className="num">% D&amp;W</th>
                <th className="num">% Yuhasz</th>
                <th className="num">AMB (mm²)</th>
                <th className="num">ENDO-MESO-ECTO</th>
                <th className="num">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((row) => (
                <tr key={row.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{row.fecha}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {row.numeroMedicion ?? '—'}
                  </td>
                  <td className="num" style={{ fontWeight: 600 }}>
                    {fmt(row.peso, 1)}
                  </td>
                  <td className="num">{fmt(row.imc, 1)}</td>
                  <td className="num">{fmt(row.cintura, 1)}</td>
                  <td className="num" style={{ fontWeight: 600, color: '#c85a32' }}>
                    {fmt(row.suma6Pliegues, 1)}
                  </td>
                  <td className="num">{fmt(row.suma8Pliegues, 1)}</td>
                  <td className="num">{fmt(row.grasaPctDurnin, 1)}%</td>
                  <td className="num">{fmt(row.grasaPctYuhasz, 1)}%</td>
                  <td className="num">{fmt(row.areaMuscBrazo, 0)}</td>
                  <td className="num">
                    {fmt(row.endo, 1)} - {fmt(row.meso, 1)} - {fmt(row.ecto, 1)}
                  </td>
                  <td className="num">
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-subtle"
                        title="Editar medición"
                        onClick={() => onEditRecord(row)}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        title="Eliminar medición"
                        onClick={() => onDeleteRecord(row.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
