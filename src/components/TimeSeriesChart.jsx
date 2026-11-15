import React, { useState, useMemo } from 'react';
import { METRIC_MAP } from '../utils/anthropometryMath.js';

function formatValue(val, decimals = 1) {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return '—';
  return Number(val).toFixed(decimals);
}

export function MiniSparkChart({ data, metricKey, isSelected, onSelect }) {
  const metric = METRIC_MAP[metricKey];
  const points = useMemo(
    () =>
      data
        .map((d) => ({ fecha: d.fecha, fechaISO: d.fechaISO, val: d[metricKey] }))
        .filter((p) => p.val !== null && p.val !== undefined && !Number.isNaN(Number(p.val))),
    [data, metricKey]
  );

  if (!metric || points.length === 0) return null;

  const vals = points.map((p) => p.val);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);
  const span = maxVal - minVal || 1;
  const first = points[0].val;
  const last = points[points.length - 1].val;
  const delta = last - first;

  const W = 260;
  const H = 64;
  const padX = 6;
  const padY = 8;

  const coords = points.map((p, i) => {
    const x = padX + (points.length === 1 ? (W - padX * 2) / 2 : (i / (points.length - 1)) * (W - padX * 2));
    const y = H - padY - ((p.val - minVal) / span) * (H - padY * 2);
    return { x, y, ...p };
  });

  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${coords[coords.length - 1].x.toFixed(1)},${H} L${coords[0].x.toFixed(1)},${H} Z`;

  const isGoodDelta =
    metric.idealTrend === 'down' ? delta < 0 : metric.idealTrend === 'up' ? delta > 0 : Math.abs(delta) < 0.01;

  return (
    <div
      className={`mini-chart-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(metricKey)}
      role="button"
      tabIndex={0}
      id={`mini-card-${metricKey}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(metricKey);
      }}
    >
      <div className="mini-chart-header">
        <span className="mini-chart-title">{metric.shortLabel}</span>
        <span className="mini-chart-val" style={{ color: metric.color }}>
          {formatValue(last, metric.decimals)}{' '}
          <small style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>{metric.unit}</small>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" style={{ height: '62px' }}>
        <path d={areaD} fill={metric.color} fillOpacity="0.1" />
        <path d={pathD} fill="none" stroke={metric.color} strokeWidth="2" strokeLinecap="round" />
        <circle
          cx={coords[coords.length - 1].x}
          cy={coords[coords.length - 1].y}
          r="3.2"
          fill={metric.color}
        />
      </svg>
      <div className="kpi-sub" style={{ marginTop: '0.35rem' }}>
        <span>
          Rango: {formatValue(minVal, metric.decimals)} – {formatValue(maxVal, metric.decimals)} {metric.unit}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color:
              Math.abs(delta) < 0.01
                ? 'var(--text-muted)'
                : isGoodDelta
                  ? 'var(--accent-positive)'
                  : 'var(--accent-caution)',
          }}
        >
          {delta > 0 ? '+' : ''}
          {formatValue(delta, metric.decimals)} {metric.unit}
        </span>
      </div>
    </div>
  );
}

export default function TimeSeriesChart({
  data,
  primaryKey,
  secondaryKey,
  showMovingAverage = true,
  onSelectPoint,
}) {
  const [hoverIdx, setHoverIdx] = useState(null);

  const primaryMetric = METRIC_MAP[primaryKey] || METRIC_MAP.peso;
  const secondaryMetric = secondaryKey && secondaryKey !== 'none' ? METRIC_MAP[secondaryKey] : null;

  const series = useMemo(() => {
    return data.filter(
      (d) => d[primaryKey] !== null && d[primaryKey] !== undefined && !Number.isNaN(Number(d[primaryKey]))
    );
  }, [data, primaryKey]);

  if (series.length === 0) {
    return (
      <div className="chart-stage" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No hay datos registrados para la métrica seleccionada ({primaryMetric.label}) en este filtro temporal.
      </div>
    );
  }

  const W = 960;
  const H = 350;
  const padL = 58;
  const padR = secondaryMetric ? 58 : 28;
  const padT = 26;
  const padB = 46;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const pVals = series.map((d) => Number(d[primaryKey]));
  const pMinRaw = Math.min(...pVals);
  const pMaxRaw = Math.max(...pVals);
  const pPad = (pMaxRaw - pMinRaw) * 0.12 || 1;
  const pMin = pMinRaw - pPad;
  const pMax = pMaxRaw + pPad;

  const sVals = secondaryMetric
    ? series.map((d) => (d[secondaryKey] != null ? Number(d[secondaryKey]) : null)).filter((v) => v !== null)
    : [];
  const sMinRaw = sVals.length ? Math.min(...sVals) : 0;
  const sMaxRaw = sVals.length ? Math.max(...sVals) : 1;
  const sPad = (sMaxRaw - sMinRaw) * 0.12 || 1;
  const sMin = sMinRaw - sPad;
  const sMax = sMaxRaw + sPad;

  const getX = (idx) => padL + (series.length === 1 ? plotW / 2 : (idx / (series.length - 1)) * plotW);
  const getPY = (val) => padT + plotH - ((val - pMin) / (pMax - pMin)) * plotH;
  const getSY = (val) => padT + plotH - ((val - sMin) / (sMax - sMin)) * plotH;

  const primaryPoints = series.map((d, i) => ({
    x: getX(i),
    y: getPY(Number(d[primaryKey])),
    val: Number(d[primaryKey]),
    record: d,
    idx: i,
  }));

  const primaryPath = primaryPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
    .join(' ');
  const primaryArea = `${primaryPath} L${primaryPoints[primaryPoints.length - 1].x.toFixed(1)},${
    padT + plotH
  } L${primaryPoints[0].x.toFixed(1)},${padT + plotH} Z`;

  // 3-point moving average
  const maPoints = primaryPoints.map((pt, i) => {
    const slice = primaryPoints.slice(Math.max(0, i - 1), Math.min(primaryPoints.length, i + 2));
    const avg = slice.reduce((acc, c) => acc + c.val, 0) / slice.length;
    return { x: pt.x, y: getPY(avg), val: avg };
  });
  const maPath = maPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');

  // Secondary metric points
  const secondaryPoints = secondaryMetric
    ? series
        .map((d, i) => {
          const v = d[secondaryKey];
          if (v === null || v === undefined || Number.isNaN(Number(v))) return null;
          return { x: getX(i), y: getSY(Number(v)), val: Number(v), idx: i };
        })
        .filter(Boolean)
    : [];
  const secondaryPath = secondaryPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
    .join(' ');

  // Y-axis ticks (5 horizontal lines)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const val = pMin + t * (pMax - pMin);
    const sVal = sMin + t * (sMax - sMin);
    const y = padT + plotH - t * plotH;
    return { y, val, sVal };
  });

  // Min & Max indices
  let minIdx = 0;
  let maxIdx = 0;
  primaryPoints.forEach((pt, idx) => {
    if (pt.val < primaryPoints[minIdx].val) minIdx = idx;
    if (pt.val > primaryPoints[maxIdx].val) maxIdx = idx;
  });

  const activePoint = hoverIdx !== null && primaryPoints[hoverIdx] ? primaryPoints[hoverIdx] : primaryPoints.at(-1);
  const prevPoint =
    activePoint && activePoint.idx > 0 ? primaryPoints[activePoint.idx - 1] : primaryPoints[0];
  const stepDelta = activePoint && prevPoint ? activePoint.val - prevPoint.val : 0;
  const totalDelta = activePoint ? activePoint.val - primaryPoints[0].val : 0;

  return (
    <div className="chart-stage" id="primary-timeseries-stage">
      {/* Interactive Top Readout Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          padding: '0.2rem 0.5rem 0.65rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.9rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: 'var(--bg-elevated)',
              padding: '0.2rem 0.55rem',
              borderRadius: '4px',
            }}
          >
            Fecha: {activePoint.record.fecha}
            {activePoint.record.numeroMedicion ? ` (Med. #${activePoint.record.numeroMedicion})` : ''}
          </span>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '0.35rem' }}>
              {primaryMetric.label}:
            </span>
            <strong
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.1rem',
                color: primaryMetric.color,
              }}
            >
              {formatValue(activePoint.val, primaryMetric.decimals)} {primaryMetric.unit}
            </strong>
          </div>
          {secondaryMetric && activePoint.record[secondaryKey] != null && (
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '0.35rem' }}>
                {secondaryMetric.label}:
              </span>
              <strong
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.05rem',
                  color: '#c85a32',
                }}
              >
                {formatValue(activePoint.record[secondaryKey], secondaryMetric.decimals)} {secondaryMetric.unit}
              </strong>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', fontFamily: 'var(--font-mono)', fontSize: '0.77rem' }}>
          <span>
            vs anterior:{' '}
            <strong>
              {stepDelta > 0 ? '+' : ''}
              {formatValue(stepDelta, primaryMetric.decimals)} {primaryMetric.unit}
            </strong>
          </span>
          <span>
            vs inicio ({primaryPoints[0].record.fecha}):{' '}
            <strong>
              {totalDelta > 0 ? '+' : ''}
              {formatValue(totalDelta, primaryMetric.decimals)} {primaryMetric.unit}
            </strong>
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg"
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={`grad-${primaryKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryMetric.color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={primaryMetric.color} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid & Y Labels */}
        {yTicks.map((t, idx) => (
          <g key={idx}>
            <line
              x1={padL}
              y1={t.y}
              x2={W - padR}
              y2={t.y}
              stroke="hsl(36, 16%, 88%)"
              strokeDasharray={idx === 0 ? undefined : '3 3'}
            />
            <text
              x={padL - 8}
              y={t.y + 4}
              textAnchor="end"
              fontSize="11"
              fontFamily="var(--font-mono)"
              fill="var(--text-muted)"
            >
              {formatValue(t.val, primaryMetric.decimals)}
            </text>
            {secondaryMetric && sVals.length > 0 && (
              <text
                x={W - padR + 8}
                y={t.y + 4}
                textAnchor="start"
                fontSize="11"
                fontFamily="var(--font-mono)"
                fill="#c85a32"
              >
                {formatValue(t.sVal, secondaryMetric.decimals)}
              </text>
            )}
          </g>
        ))}

        {/* X Axis Date Labels */}
        {primaryPoints.map((pt, i) => {
          const step = Math.max(1, Math.ceil(primaryPoints.length / 10));
          if (i % step !== 0 && i !== primaryPoints.length - 1) return null;
          return (
            <g key={pt.record.id}>
              <line x1={pt.x} y1={padT + plotH} x2={pt.x} y2={padT + plotH + 5} stroke="var(--border-strong)" />
              <text
                x={pt.x}
                y={padT + plotH + 20}
                textAnchor="middle"
                fontSize="10.5"
                fontFamily="var(--font-mono)"
                fill="var(--text-secondary)"
              >
                {pt.record.fecha.slice(0, 5)}/{pt.record.fecha.slice(8, 10)}
              </text>
            </g>
          );
        })}

        {/* Primary Area & Line */}
        <path d={primaryArea} fill={`url(#grad-${primaryKey})`} />

        {/* Moving average line */}
        {showMovingAverage && primaryPoints.length >= 3 && (
          <path
            d={maPath}
            fill="none"
            stroke={primaryMetric.color}
            strokeWidth="1.6"
            strokeDasharray="5 4"
            opacity="0.55"
          />
        )}

        <path
          d={primaryPath}
          fill="none"
          stroke={primaryMetric.color}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Secondary Metric Line */}
        {secondaryMetric && secondaryPoints.length > 1 && (
          <path
            d={secondaryPath}
            fill="none"
            stroke="#c85a32"
            strokeWidth="2.2"
            strokeDasharray="6 3"
            strokeLinecap="round"
          />
        )}

        {/* Secondary Metric Dots */}
        {secondaryMetric &&
          secondaryPoints.map((pt) => (
            <circle
              key={`sec-${pt.idx}`}
              cx={pt.x}
              cy={pt.y}
              r="3.2"
              fill="#fff"
              stroke="#c85a32"
              strokeWidth="2"
            />
          ))}

        {/* Hover Vertical Guide */}
        {activePoint && (
          <line
            x1={activePoint.x}
            y1={padT}
            x2={activePoint.x}
            y2={padT + plotH}
            stroke="var(--text-muted)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {/* Primary Data Points & Min/Max Callouts */}
        {primaryPoints.map((pt, i) => {
          const isHovered = activePoint && activePoint.idx === i;
          const isMin = i === minIdx && primaryPoints.length > 2;
          const isMax = i === maxIdx && primaryPoints.length > 2 && maxIdx !== minIdx;
          return (
            <g key={pt.record.id}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 6 : isMin || isMax ? 4.6 : 3.6}
                fill={isHovered ? primaryMetric.color : '#ffffff'}
                stroke={primaryMetric.color}
                strokeWidth={isHovered ? 2.5 : 2}
              />
              {(isMin || isMax) && (
                <text
                  x={pt.x}
                  y={isMax ? pt.y - 10 : pt.y + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="var(--font-mono)"
                  fill={primaryMetric.color}
                >
                  {isMax ? 'Máx' : 'Mín'}: {formatValue(pt.val, primaryMetric.decimals)}
                </text>
              )}
              {/* Invisible wide hit target for smooth mouse interaction */}
              <rect
                x={pt.x - plotW / Math.max(2, primaryPoints.length * 2)}
                y={padT}
                width={plotW / Math.max(1, primaryPoints.length)}
                height={plotH}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoverIdx(i)}
                onClick={() => onSelectPoint && onSelectPoint(pt.record)}
              />
            </g>
          );
        })}
      </svg>

      <div className="chart-legend-bar">
        <div className="legend-items">
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: primaryMetric.color }} />
            {primaryMetric.label} ({primaryMetric.unit || 'índice'})
          </span>
          {showMovingAverage && primaryPoints.length >= 3 && (
            <span className="legend-item">
              <span
                className="legend-swatch"
                style={{
                  background: 'transparent',
                  borderBottom: `2px dashed ${primaryMetric.color}`,
                  height: 0,
                }}
              />
              Media móvil (3 mediciones)
            </span>
          )}
          {secondaryMetric && (
            <span className="legend-item">
              <span className="legend-swatch" style={{ background: '#c85a32' }} />
              {secondaryMetric.label} ({secondaryMetric.unit || 'índice'}) [Eje derecho]
            </span>
          )}
        </div>
        <span>Pasa el cursor sobre cualquier punto para inspeccionar valores y variaciones.</span>
      </div>
    </div>
  );
}
