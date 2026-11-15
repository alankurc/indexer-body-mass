import React, { useState } from 'react';

function fmt(v, d = 1) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—';
  return Number(v).toFixed(d);
}

export default function CompositionView({ data }) {
  const [formula, setFormula] = useState('durnin'); // 'durnin' | 'yuhasz'
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const valid = data.filter((d) =>
    formula === 'durnin'
      ? d.grasaKgDurnin != null && d.magraKgDurnin != null
      : d.grasaKgYuhasz != null && d.magraKgYuhasz != null
  );

  if (valid.length === 0) {
    return (
      <div className="panel">
        <p style={{ color: 'var(--text-muted)' }}>
          No hay registros con datos completos para la ecuación seleccionada en este rango de fechas.
        </p>
      </div>
    );
  }

  const first = valid[0];
  const last = valid[valid.length - 1];
  const active = hoveredIdx !== null && valid[hoveredIdx] ? valid[hoveredIdx] : last;

  const getFatKg = (r) => (formula === 'durnin' ? r.grasaKgDurnin : r.grasaKgYuhasz);
  const getLeanKg = (r) => (formula === 'durnin' ? r.magraKgDurnin : r.magraKgYuhasz);
  const getFatPct = (r) => (formula === 'durnin' ? r.grasaPctDurnin : r.grasaPctYuhasz);

  const deltaFatKg = getFatKg(last) - getFatKg(first);
  const deltaLeanKg = getLeanKg(last) - getLeanKg(first);
  const deltaFatPct = getFatPct(last) - getFatPct(first);
  const deltaAMB = (last.areaMuscBrazo || 0) - (first.areaMuscBrazo || 0);

  const maxWeight = Math.max(...valid.map((d) => d.peso || 100)) * 1.06;

  const W = 940;
  const H = 310;
  const padL = 52;
  const padR = 24;
  const padT = 20;
  const padB = 48;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const barStep = plotW / valid.length;
  const barWidth = Math.min(28, Math.max(8, barStep * 0.64));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Fraccionamiento de Masa Magra y Masa Grasa en el Tiempo</h2>
            <p className="panel-subtitle">
              Comparación longitudinal de componentes corporales según ecuación antropométrica ({first.fecha} →{' '}
              {last.fecha})
            </p>
          </div>
          <div className="chip-group" role="tablist" aria-label="Fórmula de composición corporal">
            <button
              type="button"
              id="btn-formula-durnin"
              className={`chip-btn ${formula === 'durnin' ? 'active' : ''}`}
              onClick={() => setFormula('durnin')}
            >
              Durnin &amp; Womersley (Población Gral.)
            </button>
            <button
              type="button"
              id="btn-formula-yuhasz"
              className={`chip-btn ${formula === 'yuhasz' ? 'active' : ''}`}
              onClick={() => setFormula('yuhasz')}
            >
              Yuhasz (6 Pliegues Atletas)
            </button>
          </div>
        </div>

        {/* Summary Cards for Recomposition */}
        <div className="kpi-grid" style={{ marginBottom: '1.15rem' }}>
          <div className="kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Variación Masa Grasa ({formula === 'durnin' ? 'D&W' : 'Yuhasz'})</span>
              <span className={`kpi-delta ${deltaFatKg <= 0 ? 'good' : 'caution'}`}>
                {deltaFatKg > 0 ? '+' : ''}
                {fmt(deltaFatKg, 1)} kg
              </span>
            </div>
            <div className="kpi-main-row">
              <div>
                <span className="kpi-value">{fmt(getFatKg(last), 1)}</span>
                <span className="kpi-unit">kg ({fmt(getFatPct(last), 1)}%)</span>
              </div>
            </div>
            <div className="kpi-sub">
              <span>Inicio ({first.fecha}):</span>
              <span>
                {fmt(getFatKg(first), 1)} kg ({fmt(getFatPct(first), 1)}%)
              </span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Variación Masa Magra ({formula === 'durnin' ? 'D&W' : 'Yuhasz'})</span>
              <span className={`kpi-delta ${deltaLeanKg >= 0 ? 'good' : 'caution'}`}>
                {deltaLeanKg > 0 ? '+' : ''}
                {fmt(deltaLeanKg, 1)} kg
              </span>
            </div>
            <div className="kpi-main-row">
              <div>
                <span className="kpi-value">{fmt(getLeanKg(last), 1)}</span>
                <span className="kpi-unit">kg ({fmt(100 - getFatPct(last), 1)}%)</span>
              </div>
            </div>
            <div className="kpi-sub">
              <span>Inicio ({first.fecha}):</span>
              <span>
                {fmt(getLeanKg(first), 1)} kg ({fmt(100 - getFatPct(first), 1)}%)
              </span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Cambio en % Adiposo</span>
              <span className={`kpi-delta ${deltaFatPct <= 0 ? 'good' : 'caution'}`}>
                {deltaFatPct > 0 ? '+' : ''}
                {fmt(deltaFatPct, 1)} pp
              </span>
            </div>
            <div className="kpi-main-row">
              <div>
                <span className="kpi-value">{fmt(getFatPct(last), 1)}</span>
                <span className="kpi-unit">%</span>
              </div>
            </div>
            <div className="kpi-sub">
              <span>Relación Magra / Grasa:</span>
              <span>{fmt(getLeanKg(last) / Math.max(0.1, getFatKg(last)), 2)} : 1</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Área Muscular de Brazo</span>
              <span className={`kpi-delta ${deltaAMB >= 0 ? 'good' : 'caution'}`}>
                {deltaAMB > 0 ? '+' : ''}
                {fmt(deltaAMB, 0)} mm²
              </span>
            </div>
            <div className="kpi-main-row">
              <div>
                <span className="kpi-value">{fmt(last.areaMuscBrazo, 0)}</span>
                <span className="kpi-unit">mm²</span>
              </div>
            </div>
            <div className="kpi-sub">
              <span>Inicio ({first.fecha}):</span>
              <span>{fmt(first.areaMuscBrazo, 0)} mm²</span>
            </div>
          </div>
        </div>

        {/* Stacked Bar Chart of Lean Mass + Fat Mass */}
        <div className="chart-stage">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.15rem 0.45rem 0.6rem',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '0.5rem',
              fontSize: '0.82rem',
            }}
          >
            <div>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{active.fecha}</strong> — Peso Total:{' '}
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{fmt(active.peso, 1)} kg</strong>
            </div>
            <div style={{ display: 'flex', gap: '1.1rem', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: '#23785a', fontWeight: 600 }}>
                Masa Magra: {fmt(getLeanKg(active), 1)} kg ({fmt(100 - getFatPct(active), 1)}%)
              </span>
              <span style={{ color: '#c85a32', fontWeight: 600 }}>
                Masa Grasa: {fmt(getFatKg(active), 1)} kg ({fmt(getFatPct(active), 1)}%)
              </span>
            </div>
          </div>

          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="chart-svg"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {[0, 25, 50, 75, 100].map((val) => {
              if (val > maxWeight) return null;
              const y = padT + plotH - (val / maxWeight) * plotH;
              return (
                <g key={val}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={W - padR}
                    y2={y}
                    stroke="hsl(36, 16%, 88%)"
                    strokeDasharray={val === 0 ? undefined : '3 3'}
                  />
                  <text
                    x={padL - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10.5"
                    fontFamily="var(--font-mono)"
                    fill="var(--text-muted)"
                  >
                    {val} kg
                  </text>
                </g>
              );
            })}

            {valid.map((d, i) => {
              const lean = getLeanKg(d) || 0;
              const fat = getFatKg(d) || 0;
              const xCenter = padL + barStep * i + barStep / 2;
              const x = xCenter - barWidth / 2;

              const leanH = (lean / maxWeight) * plotH;
              const fatH = (fat / maxWeight) * plotH;

              const leanY = padT + plotH - leanH;
              const fatY = leanY - fatH;

              const isHovered = hoveredIdx === i;
              const labelStep = Math.max(1, Math.ceil(valid.length / 12));

              return (
                <g
                  key={d.id}
                  onMouseEnter={() => setHoveredIdx(i)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Lean Mass (bottom part of bar) */}
                  <rect
                    x={x}
                    y={leanY}
                    width={barWidth}
                    height={leanH}
                    rx="2"
                    fill="#23785a"
                    opacity={isHovered ? 1 : 0.85}
                  />
                  {/* Fat Mass (top part of bar) */}
                  <rect
                    x={x}
                    y={fatY}
                    width={barWidth}
                    height={fatH}
                    rx="2"
                    fill="#c85a32"
                    opacity={isHovered ? 1 : 0.88}
                  />

                  {/* Percentage label on top of bar */}
                  {(isHovered || i === 0 || i === valid.length - 1) && (
                    <text
                      x={xCenter}
                      y={fatY - 6}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="600"
                      fontFamily="var(--font-mono)"
                      fill="var(--text-primary)"
                    >
                      {fmt(getFatPct(d), 1)}%
                    </text>
                  )}

                  {(i % labelStep === 0 || i === valid.length - 1) && (
                    <text
                      x={xCenter}
                      y={padT + plotH + 18}
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      fill="var(--text-secondary)"
                    >
                      {d.fecha.slice(0, 5)}/{d.fecha.slice(8, 10)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="chart-legend-bar">
            <div className="legend-items">
              <span className="legend-item">
                <span className="legend-swatch" style={{ background: '#23785a' }} />
                Masa Magra (kg)
              </span>
              <span className="legend-item">
                <span className="legend-swatch" style={{ background: '#c85a32' }} />
                Masa Grasa (kg)
              </span>
            </div>
            <span>Altura total de cada barra = Peso Corporal Total (kg).</span>
          </div>
        </div>
      </div>

      {/* Side by side comparison table of Durnin & Womersley vs Yuhasz */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">Comparativa Simultánea: Durnin &amp; Womersley vs. Yuhasz (Atletas)</h3>
            <p className="panel-subtitle">
              Ambos modelos incluidos en la hoja de resultados de tus PDFs (en amarillo Durnin &amp; Womersley; en
              terracota Yuhasz Atletas).
            </p>
          </div>
        </div>
        <div className="table-scroll" style={{ maxHeight: '360px' }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th className="num">Peso (kg)</th>
                <th className="num">Σ 6 Pl. (mm)</th>
                <th className="num">% Durnin &amp; W</th>
                <th className="num">Grasa D&amp;W (kg)</th>
                <th className="num">Magra D&amp;W (kg)</th>
                <th className="num">% Yuhasz</th>
                <th className="num">Grasa Yuh. (kg)</th>
                <th className="num">Magra Yuh. (kg)</th>
                <th className="num">Área Musc. Brazo (mm²)</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((row) => (
                <tr key={row.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{row.fecha}</td>
                  <td className="num">{fmt(row.peso, 1)}</td>
                  <td className="num">{fmt(row.suma6Pliegues, 1)}</td>
                  <td className="num" style={{ background: 'hsla(48, 88%, 90%, 0.45)', fontWeight: 600 }}>
                    {fmt(row.grasaPctDurnin, 1)}%
                  </td>
                  <td className="num" style={{ background: 'hsla(48, 88%, 90%, 0.45)' }}>
                    {fmt(row.grasaKgDurnin, 1)}
                  </td>
                  <td className="num" style={{ background: 'hsla(48, 88%, 90%, 0.45)' }}>
                    {fmt(row.magraKgDurnin, 1)}
                  </td>
                  <td className="num" style={{ background: 'hsla(18, 65%, 90%, 0.45)', fontWeight: 600 }}>
                    {fmt(row.grasaPctYuhasz, 1)}%
                  </td>
                  <td className="num" style={{ background: 'hsla(18, 65%, 90%, 0.45)' }}>
                    {fmt(row.grasaKgYuhasz, 1)}
                  </td>
                  <td className="num" style={{ background: 'hsla(18, 65%, 90%, 0.45)' }}>
                    {fmt(row.magraKgYuhasz, 1)}
                  </td>
                  <td className="num">{fmt(row.areaMuscBrazo, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
