import React, { useState } from 'react';

function fmt(v, d = 1) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—';
  return Number(v).toFixed(d);
}

function getRatingBucket(val) {
  if (val == null) return -1;
  if (val < 2.75) return 0; // 1 to 2.5
  if (val < 5.25) return 1; // 3 to 5
  if (val < 7.25) return 2; // 5.5 to 7
  return 3; // 7.5 to 8.5+
}

export default function SomatocartaView({ data }) {
  const valid = data.filter((d) => d.somatoX != null && d.somatoY != null);
  const [selectedId, setSelectedId] = useState(null);

  if (valid.length === 0) {
    return (
      <div className="panel">
        <p style={{ color: 'var(--text-muted)' }}>No hay datos de Somatotipo disponibles para graficar.</p>
      </div>
    );
  }

  const active = valid.find((d) => d.id === selectedId) || valid[valid.length - 1];
  const first = valid[0];

  // Coordinate space of Somatocarta:
  // X ranges from -8 to +8
  // Y ranges from -9 to +13
  const W = 560;
  const H = 500;
  const xMin = -8;
  const xMax = 8;
  const yMin = -9;
  const yMax = 13;

  const padL = 44;
  const padR = 52;
  const padT = 36;
  const padB = 46;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const toSvgX = (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW;
  const toSvgY = (y) => padT + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  // Vertices of the Heath & Carter triangle:
  // Top (Mesomorfo): (0, 12)
  // Bottom-Left (Endomorfo): (-6, -6)
  // Bottom-Right (Ectomorfo): (6, -6)
  const topX = toSvgX(0);
  const topY = toSvgY(12);
  const leftX = toSvgX(-6);
  const leftY = toSvgY(-6);
  const rightX = toSvgX(6);
  const rightY = toSvgY(-6);
  const origX = toSvgX(0);
  const origY = toSvgY(0);

  // Curved Reuleaux triangle path matching Heath & Carter Somatocarta
  const somatoTrianglePath = `
    M ${topX} ${topY}
    Q ${toSvgX(5.4)} ${toSvgY(4.5)} ${rightX} ${rightY}
    Q ${toSvgX(0)} ${toSvgY(-8.8)} ${leftX} ${leftY}
    Q ${toSvgX(-5.4)} ${toSvgY(4.5)} ${topX} ${topY}
    Z
  `;

  // Trajectory path across all measurements
  const trajectoryPath = valid
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toSvgX(d.somatoX).toFixed(1)},${toSvgY(d.somatoY).toFixed(1)}`)
    .join(' ');

  const endoBucket = getRatingBucket(active.endo);
  const mesoBucket = getRatingBucket(active.meso);
  const ectoBucket = getRatingBucket(active.ecto);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="two-col-grid">
        {/* Left: Interactive Somatocarta de Heath & Carter */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Somatocarta de Heath &amp; Carter</h2>
              <p className="panel-subtitle">
                Trayectoria morfológica desde {first.fecha} hasta {valid[valid.length - 1].fecha}. Haz clic en cualquier
                punto para inspeccionarlo.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" style={{ maxWidth: '540px' }}>
              {/* Outer Frame */}
              <rect
                x={padL}
                y={padT}
                width={plotW}
                height={plotH}
                fill="hsl(40, 38%, 99%)"
                stroke="var(--border-strong)"
                strokeWidth="1.2"
              />

              {/* Curved Reuleaux Somatocarta Triangle */}
              <path
                d={somatoTrianglePath}
                fill="hsla(180, 42%, 93%, 0.35)"
                stroke="hsl(205, 22%, 42%)"
                strokeWidth="1.8"
              />

              {/* Three Bisecting Axes Passing Through Origin (0,0) */}
              {/* Vertical axis: (0, -7.4) to (0, 12) */}
              <line
                x1={origX}
                y1={toSvgY(-7.4)}
                x2={topX}
                y2={topY}
                stroke="hsl(205, 22%, 45%)"
                strokeWidth="1.2"
              />
              {/* Axis from Endomorfo (-6, -6) through (0,0) to upper-right (4.2, 4.2) */}
              <line
                x1={leftX}
                y1={leftY}
                x2={toSvgX(4.3)}
                y2={toSvgY(4.3)}
                stroke="hsl(205, 22%, 45%)"
                strokeWidth="1.2"
              />
              {/* Axis from Ectomorfo (6, -6) through (0,0) to upper-left (-4.2, 4.2) */}
              <line
                x1={rightX}
                y1={rightY}
                x2={toSvgX(-4.3)}
                y2={toSvgY(4.3)}
                stroke="hsl(205, 22%, 45%)"
                strokeWidth="1.2"
              />

              {/* Corner Labels */}
              <text
                x={topX}
                y={topY - 10}
                textAnchor="middle"
                fontSize="11.5"
                fontWeight="700"
                fill="#2b6cb0"
              >
                MESOMORFO
              </text>
              <text
                x={leftX - 4}
                y={leftY + 28}
                textAnchor="middle"
                fontSize="11.5"
                fontWeight="700"
                fill="#d97724"
              >
                ENDOMORFO
              </text>
              <text
                x={rightX + 4}
                y={rightY + 28}
                textAnchor="middle"
                fontSize="11.5"
                fontWeight="700"
                fill="#23785a"
              >
                ECTOMORFO
              </text>

              {/* X Axis Ticks (-6 to +6) */}
              {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((xv) => (
                <g key={`x-${xv}`}>
                  <line
                    x1={toSvgX(xv)}
                    y1={padT + plotH}
                    x2={toSvgX(xv)}
                    y2={padT + plotH + 5}
                    stroke="var(--text-secondary)"
                  />
                  <text
                    x={toSvgX(xv)}
                    y={padT + plotH + 17}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="600"
                    fontFamily="var(--font-mono)"
                    fill="var(--text-primary)"
                  >
                    {xv > 0 ? `+${xv}` : xv}
                  </text>
                </g>
              ))}

              {/* Y Axis Ticks (-8 to +10 on right edge) */}
              {[-8, -6, -4, -2, 0, 2, 4, 6, 8, 10].map((yv) => (
                <g key={`y-${yv}`}>
                  <line
                    x1={padL + plotW}
                    y1={toSvgY(yv)}
                    x2={padL + plotW + 5}
                    y2={toSvgY(yv)}
                    stroke="var(--text-secondary)"
                  />
                  <text
                    x={padL + plotW + 10}
                    y={toSvgY(yv) + 4}
                    textAnchor="start"
                    fontSize="10.5"
                    fontWeight="600"
                    fontFamily="var(--font-mono)"
                    fill="var(--text-primary)"
                  >
                    {yv > 0 ? `+${yv}` : yv}
                  </text>
                </g>
              ))}

              {/* Trajectory Line connecting chronological measurements */}
              {valid.length > 1 && (
                <path
                  d={trajectoryPath}
                  fill="none"
                  stroke="#0d6e6e"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  opacity="0.7"
                />
              )}

              {/* Historical Points */}
              {valid.map((d, idx) => {
                const px = toSvgX(d.somatoX);
                const py = toSvgY(d.somatoY);
                const isSelected = d.id === active.id;
                const isFirst = idx === 0;
                const isLast = idx === valid.length - 1;
                return (
                  <g
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={px}
                      cy={py}
                      r={isSelected ? 7.5 : isFirst || isLast ? 5.5 : 4}
                      fill={isSelected ? '#1d4ed8' : isFirst ? '#c85a32' : '#0d6e6e'}
                      stroke="#ffffff"
                      strokeWidth="1.8"
                      opacity={isSelected ? 1 : 0.78}
                    />
                    {isSelected && (
                      <circle
                        cx={px}
                        cy={py}
                        r="12"
                        fill="none"
                        stroke="#1d4ed8"
                        strokeWidth="1.5"
                        opacity="0.45"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            <div className="legend-items" style={{ marginTop: '0.35rem', fontSize: '0.78rem' }}>
              <span className="legend-item">
                <span className="legend-swatch" style={{ background: '#c85a32', borderRadius: '50%' }} />
                Inicio ({first.fecha}: {fmt(first.endo)} - {fmt(first.meso)} - {fmt(first.ecto)})
              </span>
              <span className="legend-item">
                <span className="legend-swatch" style={{ background: '#1d4ed8', borderRadius: '50%' }} />
                Seleccionado ({active.fecha}: {fmt(active.endo)} - {fmt(active.meso)} - {fmt(active.ecto)})
              </span>
            </div>
          </div>
        </div>

        {/* Right: Rating de Somatotipo & Evolution of Endo / Meso / Ecto */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Rating de Somatotipo ({active.fecha})</h2>
                <p className="panel-subtitle">
                  Clasificación actual: <strong>{active.somatoCategoria}</strong> (
                  {active.somatoOrigen === 'pdf' ? 'Extraído de Hoja 2 del PDF' : 'Calculado por Ecuación Carter & Heath'})
                </p>
              </div>
              <select
                aria-label="Seleccionar fecha de somatotipo"
                className="select-input"
                value={active.id}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {[...valid].reverse().map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fecha} — ({fmt(d.endo)} / {fmt(d.meso)} / {fmt(d.ecto)})
                  </option>
                ))}
              </select>
            </div>

            {/* Three Big Somatotype Component Cards matching the PDF colors */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              <div
                style={{
                  background: 'hsla(28, 80%, 94%, 0.7)',
                  border: '1px solid rgba(217, 119, 36, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.9rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>
                  ENDO (Adiposidad)
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.85rem',
                    fontWeight: 700,
                    color: '#d97724',
                    margin: '0.2rem 0',
                  }}
                >
                  {fmt(active.endo, 1)}
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                  Inicio: {fmt(first.endo, 1)} ({active.endo - first.endo > 0 ? '+' : ''}
                  {fmt(active.endo - first.endo, 1)})
                </div>
              </div>

              <div
                style={{
                  background: 'hsla(212, 80%, 95%, 0.7)',
                  border: '1px solid rgba(43, 108, 176, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.9rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: '#1e40af' }}>
                  MESO (Músculo-Óseo)
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.85rem',
                    fontWeight: 700,
                    color: '#2b6cb0',
                    margin: '0.2rem 0',
                  }}
                >
                  {fmt(active.meso, 1)}
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                  Inicio: {fmt(first.meso, 1)} ({active.meso - first.meso > 0 ? '+' : ''}
                  {fmt(active.meso - first.meso, 1)})
                </div>
              </div>

              <div
                style={{
                  background: 'hsla(154, 60%, 94%, 0.7)',
                  border: '1px solid rgba(35, 120, 90, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.9rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: '#065f46' }}>
                  ECTO (Linearidad)
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.85rem',
                    fontWeight: 700,
                    color: '#23785a',
                    margin: '0.2rem 0',
                  }}
                >
                  {fmt(active.ecto, 1)}
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                  Inicio: {fmt(first.ecto, 1)} ({active.ecto - first.ecto > 0 ? '+' : ''}
                  {fmt(active.ecto - first.ecto, 1)})
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                background: 'var(--bg-subtle)',
                padding: '0.6rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                marginBottom: '1rem',
              }}
            >
              <span>
                Coordenada X (ecto - endo): <strong>{fmt(active.somatoX, 2)}</strong>
              </span>
              <span>
                Coordenada Y (2×meso - (ecto + endo)): <strong>{fmt(active.somatoY, 2)}</strong>
              </span>
            </div>

            {/* Escala de Rating y Características (Carter y Heath, 1990) */}
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Escala de Rating y Características (Carter y Heath, 1990)
            </h3>
            <div className="table-scroll">
              <table className="rating-scale-table">
                <thead>
                  <tr>
                    <th>Componente</th>
                    <th>1 · 1½ · 2 · 2½</th>
                    <th>3 · 3½ · 4 · 4½ · 5</th>
                    <th>5½ · 6 · 6½ · 7</th>
                    <th>7½ · 8 · 8½</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700, background: 'hsla(48, 80%, 88%, 0.5)' }}>
                      ENDOMORFIA
                      <div style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        Adiposidad Relativa ({fmt(active.endo, 1)})
                      </div>
                    </td>
                    <td className={endoBucket === 0 ? 'active-bucket' : ''}>
                      Baja adiposidad relativa; poca grasa subcutánea; contornos musculares y óseos visibles.
                    </td>
                    <td className={endoBucket === 1 ? 'active-bucket' : ''}>
                      Moderada adiposidad relativa; la grasa subcutánea cubre los contornos musculares y óseos.
                    </td>
                    <td className={endoBucket === 2 ? 'active-bucket' : ''}>
                      Alta adiposidad relativa; grasa subcutánea abundante; mayor acumulación en el tronco.
                    </td>
                    <td className={endoBucket === 3 ? 'active-bucket' : ''}>
                      Extremadamente alta adiposidad relativa; muy abundante grasa subcutánea.
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, background: 'hsla(48, 80%, 88%, 0.5)' }}>
                      MESOMORFIA
                      <div style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        Robustez Músculo-Esquelética ({fmt(active.meso, 1)})
                      </div>
                    </td>
                    <td className={mesoBucket === 0 ? 'active-bucket' : ''}>
                      Bajo desarrollo músculo-esquelético relativo; diámetros óseos y musculares estrechos.
                    </td>
                    <td className={mesoBucket === 1 ? 'active-bucket' : ''}>
                      Moderado desarrollo músculo-esquelético relativo; mayor volumen muscular y óseo.
                    </td>
                    <td className={mesoBucket === 2 ? 'active-bucket' : ''}>
                      Alto desarrollo músculo-esquelético relativo; diámetros óseos grandes y músculos de gran volumen.
                    </td>
                    <td className={mesoBucket === 3 ? 'active-bucket' : ''}>
                      Desarrollo músculo-esquelético relativo extremadamente alto; músculos muy voluminosos.
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, background: 'hsla(48, 80%, 88%, 0.5)' }}>
                      ECTOMORFIA
                      <div style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        Linearidad Relativa ({fmt(active.ecto, 1)})
                      </div>
                    </td>
                    <td className={ectoBucket === 0 ? 'active-bucket' : ''}>
                      Gran volumen por unidad de altura; extremidades relativamente voluminosas.
                    </td>
                    <td className={ectoBucket === 1 ? 'active-bucket' : ''}>
                      Linearidad relativa moderada; menos volumen por unidad de altura; más estirado.
                    </td>
                    <td className={ectoBucket === 2 ? 'active-bucket' : ''}>
                      Linearidad relativa elevada; poco volumen por unidad de altura.
                    </td>
                    <td className={ectoBucket === 3 ? 'active-bucket' : ''}>
                      Linearidad relativa extremadamente alta; volumen mínimo por unidad de altura.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
