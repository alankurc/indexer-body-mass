import React, { useState, useMemo, useEffect } from 'react';

const SKINFOLD_AXES = [
  { key: 'triceps', label: 'Tríceps', color: '#c85a32' },
  { key: 'subescapular', label: 'Subescapular', color: '#d97724' },
  { key: 'biceps', label: 'Bíceps', color: '#2b6cb0' },
  { key: 'crestaIliaca', label: 'Cresta Ilíaca', color: '#8e3b46' },
  { key: 'supraespinal', label: 'Supraespinal', color: '#b7791f' },
  { key: 'abdominal', label: 'Abdominal', color: '#c53030' },
  { key: 'musloMedial', label: 'Muslo Medial', color: '#0d6e6e' },
  { key: 'pantorrillaPliegue', label: 'Pantorrilla', color: '#23785a' },
];

const PERIMETER_AXES = [
  { key: 'brazoRelajado', label: 'Brazo Relajado', ideal: 'up', color: '#2b6cb0' },
  { key: 'brazoFlexionado', label: 'Brazo en Tensión', ideal: 'up', color: '#23785a' },
  { key: 'cintura', label: 'Cintura (mínima)', ideal: 'down', color: '#c85a32' },
  { key: 'caderas', label: 'Caderas (máxima)', ideal: 'down', color: '#8c583a' },
  { key: 'pantorrillaPerimetro', label: 'Pantorrilla (máxima)', ideal: 'up', color: '#0d6e6e' },
];

function fmt(v, d = 1) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—';
  return Number(v).toFixed(d);
}

export default function SkinfoldsPerimetersView({ data, baseRecord, currentRecord, onChangeBase, onChangeCurrent }) {
  const [hiddenSkinfolds, setHiddenSkinfolds] = useState({});
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 640 : false));

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleSkinfold = (key) => {
    setHiddenSkinfolds((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const base = baseRecord || data[0];
  const current = currentRecord || data[data.length - 1];

  const R_SIZE = 340;
  const cx = R_SIZE / 2;
  const cy = R_SIZE / 2;
  const radius = 112;

  const maxSkinfold = useMemo(() => {
    let m = 25;
    data.forEach((d) => {
      SKINFOLD_AXES.forEach((ax) => {
        if (d[ax.key] != null && d[ax.key] > m) m = d[ax.key];
      });
    });
    return Math.ceil(m / 5) * 5;
  }, [data]);

  const buildPolygon = (rec) => {
    if (!rec) return '';
    return SKINFOLD_AXES.map((ax, i) => {
      const angle = (Math.PI * 2 * i) / SKINFOLD_AXES.length - Math.PI / 2;
      const val = rec[ax.key] != null ? Number(rec[ax.key]) : 0;
      const r = (val / maxSkinfold) * radius;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const W = isMobile ? 540 : 940;
  const H = isMobile ? 280 : 310;
  const padL = isMobile ? 44 : 48;
  const padR = isMobile ? 16 : 24;
  const padT = 20;
  const padB = 42;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const getX = (idx) => padL + (data.length <= 1 ? plotW / 2 : (idx / (data.length - 1)) * plotW);
  const getY = (val) => padT + plotH - (val / maxSkinfold) * plotH;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Selector of two dates to compare */}
      <div className="control-bar">
        <div className="control-group">
          <span className="control-label">Comparar:</span>
          <label htmlFor="skinfold-base-select" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Ref (A):
          </label>
          <select
            id="skinfold-base-select"
            className="select-input"
            value={base?.id || ''}
            onChange={(e) => onChangeBase(e.target.value)}
          >
            {data.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fecha} ({fmt(d.peso)} kg · Σ6: {fmt(d.suma6Pliegues)} mm)
              </option>
            ))}
          </select>

          <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>→</span>

          <label htmlFor="skinfold-curr-select" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Actual (B):
          </label>
          <select
            id="skinfold-curr-select"
            className="select-input"
            value={current?.id || ''}
            onChange={(e) => onChangeCurrent(e.target.value)}
          >
            {data.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fecha} ({fmt(d.peso)} kg · Σ6: {fmt(d.suma6Pliegues)} mm)
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <button
            type="button"
            className="btn btn-sm btn-subtle"
            onClick={() => {
              if (data.length >= 2) {
                onChangeBase(data[0].id);
                onChangeCurrent(data[data.length - 1].id);
              }
            }}
          >
            Primera vs. Última
          </button>
          <button
            type="button"
            className="btn btn-sm btn-subtle"
            onClick={() => {
              if (data.length >= 2) {
                onChangeBase(data[data.length - 2].id);
                onChangeCurrent(data[data.length - 1].id);
              }
            }}
          >
            Anterior vs. Última
          </button>
        </div>
      </div>

      <div className="two-col-grid">
        {/* Left: Radar Chart of 8 Skinfolds */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Perfil Radar de 8 Pliegues Cutáneos (mm)</h2>
              <p className="panel-subtitle">
                Superposición del perfil subcutáneo entre {base?.fecha} y {current?.fecha}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg viewBox={`0 0 ${R_SIZE} ${R_SIZE}`} style={{ width: '100%', maxWidth: '350px', height: 'auto' }}>
              {[0.25, 0.5, 0.75, 1].map((t) => (
                <g key={t}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius * t}
                    fill="none"
                    stroke="hsl(36, 16%, 85%)"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={cx + 4}
                    y={cy - radius * t + 10}
                    fontSize="9"
                    fontFamily="var(--font-mono)"
                    fill="var(--text-muted)"
                  >
                    {Math.round(maxSkinfold * t)}mm
                  </text>
                </g>
              ))}

              {SKINFOLD_AXES.map((ax, i) => {
                const angle = (Math.PI * 2 * i) / SKINFOLD_AXES.length - Math.PI / 2;
                const x2 = cx + radius * Math.cos(angle);
                const y2 = cy + radius * Math.sin(angle);
                const lx = cx + (radius + 26) * Math.cos(angle);
                const ly = cy + (radius + 20) * Math.sin(angle);
                return (
                  <g key={ax.key}>
                    <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="hsl(36, 16%, 82%)" />
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="10.5"
                      fontWeight="600"
                      fill="var(--text-primary)"
                    >
                      {ax.label}
                    </text>
                  </g>
                );
              })}

              {base && (
                <polygon
                  points={buildPolygon(base)}
                  fill="hsla(16, 62%, 47%, 0.16)"
                  stroke="#c85a32"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              )}

              {current && (
                <polygon
                  points={buildPolygon(current)}
                  fill="hsla(180, 74%, 24%, 0.24)"
                  stroke="#0d6e6e"
                  strokeWidth="2.4"
                />
              )}
            </svg>

            <div className="legend-items" style={{ marginTop: '0.5rem', fontSize: '0.78rem' }}>
              <span className="legend-item">
                <span className="legend-swatch" style={{ background: '#c85a32' }} />
                Ref ({base?.fecha}) — Σ6: {fmt(base?.suma6Pliegues)} mm
              </span>
              <span className="legend-item">
                <span className="legend-swatch" style={{ background: '#0d6e6e' }} />
                Actual ({current?.fecha}) — Σ6: {fmt(current?.suma6Pliegues)} mm
              </span>
            </div>
          </div>
        </div>

        {/* Right: Delta Bars for Skinfolds & Perimeters */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Variación por Sitio Anatómico ({base?.fecha} → {current?.fecha})</h2>
              <p className="panel-subtitle">Diferencias exactas en pliegues (mm) y perímetros (cm)</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="form-section-title">8 Pliegues Cutáneos (mm)</div>
            {SKINFOLD_AXES.map((ax) => {
              const vA = base?.[ax.key];
              const vB = current?.[ax.key];
              const diff = vA != null && vB != null ? vB - vA : null;
              const pctW = vB != null ? Math.min(100, (vB / maxSkinfold) * 100) : 0;
              const basePctW = vA != null ? Math.min(100, (vA / maxSkinfold) * 100) : 0;
              return (
                <div key={ax.key} className="skinfold-delta-row">
                  <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ax.label}
                  </span>
                  <div
                    style={{
                      position: 'relative',
                      height: '12px',
                      background: 'var(--bg-subtle)',
                      borderRadius: '999px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: `${basePctW}%`,
                        background: 'rgba(200, 90, 50, 0.28)',
                        borderRadius: '999px',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '2px',
                        bottom: '2px',
                        left: 0,
                        width: `${pctW}%`,
                        background: 'var(--accent-primary)',
                        borderRadius: '999px',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      textAlign: 'right',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.73rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>
                      {fmt(vA)}→<strong>{fmt(vB)}</strong>
                    </span>{' '}
                    {diff !== null && (
                      <span
                        style={{
                          color: diff <= 0 ? 'var(--accent-positive)' : 'var(--accent-caution)',
                          fontWeight: 600,
                        }}
                      >
                        ({diff > 0 ? '+' : ''}
                        {fmt(diff)})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="form-section-title" style={{ marginTop: '0.65rem' }}>
              5 Perímetros Musculares y Troncales (cm)
            </div>
            {PERIMETER_AXES.map((ax) => {
              const vA = base?.[ax.key];
              const vB = current?.[ax.key];
              const diff = vA != null && vB != null ? vB - vA : null;
              const isGood = ax.ideal === 'down' ? diff <= 0 : diff >= 0;
              return (
                <div
                  key={ax.key}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.35rem',
                    padding: '0.32rem 0.5rem',
                    background: 'var(--bg-subtle)',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{ax.label}</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                    <span>
                      {fmt(vA)} → <strong>{fmt(vB)} cm</strong>
                    </span>{' '}
                    {diff !== null && (
                      <span
                        style={{
                          marginLeft: '0.25rem',
                          color:
                            Math.abs(diff) < 0.05
                              ? 'var(--text-muted)'
                              : isGood
                                ? 'var(--accent-positive)'
                                : 'var(--accent-caution)',
                          fontWeight: 600,
                        }}
                      >
                        ({diff > 0 ? '+' : ''}
                        {fmt(diff)})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Multi-line Evolution of all 8 Skinfolds */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Curvas de Evolución Simultánea de los 8 Pliegues Cutáneos (mm)</h2>
            <p className="panel-subtitle">
              Toca cualquier pliegue para ocultarlo o aislarlo en el gráfico temporal.
            </p>
          </div>
          <div className="metric-pills">
            {SKINFOLD_AXES.map((ax) => {
              const isHidden = !!hiddenSkinfolds[ax.key];
              return (
                <button
                  key={ax.key}
                  type="button"
                  className="metric-pill"
                  style={{
                    borderColor: ax.color,
                    background: isHidden ? 'transparent' : ax.color,
                    color: isHidden ? 'var(--text-muted)' : '#fff',
                    opacity: isHidden ? 0.55 : 1,
                  }}
                  onClick={() => toggleSkinfold(ax.key)}
                >
                  {ax.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="chart-stage">
          <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg">
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const val = Math.round(t * maxSkinfold);
              const y = padT + plotH - t * plotH;
              return (
                <g key={t}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={W - padR}
                    y2={y}
                    stroke="hsl(36, 16%, 88%)"
                    strokeDasharray={t === 0 ? undefined : '3 3'}
                  />
                  <text
                    x={padL - 6}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10.5"
                    fontFamily="var(--font-mono)"
                    fill="var(--text-muted)"
                  >
                    {val}mm
                  </text>
                </g>
              );
            })}

            {data.map((d, i) => {
              const step = Math.max(1, Math.ceil(data.length / (isMobile ? 5 : 10)));
              if (i % step !== 0 && i !== data.length - 1) return null;
              const x = getX(i);
              return (
                <text
                  key={d.id}
                  x={x}
                  y={padT + plotH + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  fill="var(--text-secondary)"
                >
                  {d.fecha.slice(0, 5)}/{d.fecha.slice(8, 10)}
                </text>
              );
            })}

            {SKINFOLD_AXES.map((ax) => {
              if (hiddenSkinfolds[ax.key]) return null;
              const pts = data
                .map((d, i) => (d[ax.key] != null ? { x: getX(i), y: getY(Number(d[ax.key])), val: d[ax.key] } : null))
                .filter(Boolean);
              if (pts.length < 2) return null;
              const dPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
              return (
                <g key={ax.key}>
                  <path d={dPath} fill="none" stroke={ax.color} strokeWidth="2.1" strokeLinecap="round" />
                  {pts.map((p, idx) => (
                    <circle key={idx} cx={p.x} cy={p.y} r="2.8" fill={ax.color} />
                  ))}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
