import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Upload,
  Plus,
  Download,
  FileSpreadsheet,
  RotateCcw,
  TrendingUp,
  Layers,
  Activity,
  Compass,
  Table2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { PRELOADED_MEASUREMENTS } from './data/preloadedMeasurements.js';
import { METRIC_CATEGORIES, METRICS, METRIC_MAP, enrichMeasurement } from './utils/anthropometryMath.js';
import { parseUploadedFile } from './utils/pdfParser.js';
import TimeSeriesChart, { MiniSparkChart } from './components/TimeSeriesChart.jsx';
import CompositionView from './components/CompositionView.jsx';
import SkinfoldsPerimetersView from './components/SkinfoldsPerimetersView.jsx';
import SomatocartaView from './components/SomatocartaView.jsx';
import ReportTableAndEditor, { MeasurementModal } from './components/ReportTableAndEditor.jsx';

const STORAGE_KEY = 'indexer_body_mass_measurements_v1';

function fmt(val, decimals = 1) {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return '—';
  return Number(val).toFixed(decimals);
}

export default function App() {
  const [measurements, setMeasurements] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m) => enrichMeasurement(m)).sort((a, b) => a.fechaISO.localeCompare(b.fechaISO));
        }
      }
    } catch {
      // Fallback to preloaded
    }
    return PRELOADED_MEASUREMENTS.map((m) => enrichMeasurement(m)).sort((a, b) =>
      a.fechaISO.localeCompare(b.fechaISO)
    );
  });

  const [activeView, setActiveView] = useState('evolucion');
  const [activeCategory, setActiveCategory] = useState('composicion');
  const [primaryMetricKey, setPrimaryMetricKey] = useState('peso');
  const [secondaryMetricKey, setSecondaryMetricKey] = useState('suma6Pliegues');
  const [showMovingAvg, setShowMovingAvg] = useState(true);

  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'pdf'
  const [periodFilter, setPeriodFilter] = useState('all'); // 'all' | '12m' | '24m' | '2026' | '2025' | '2024' | '2023' | '2022'
  const [kpiCompareMode, setKpiCompareMode] = useState('prev'); // 'prev' | 'first'

  const [compareBaseId, setCompareBaseId] = useState(null);
  const [compareCurrentId, setCompareCurrentId] = useState(null);

  const [editingRecord, setEditingRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [statusMessage, setStatusMessage] = useState(null);
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(measurements));
    } catch {
      // Ignore quota errors
    }
  }, [measurements]);

  // Filtered measurements by source and period
  const filteredData = useMemo(() => {
    let list = [...measurements].sort((a, b) => a.fechaISO.localeCompare(b.fechaISO));
    if (sourceFilter === 'pdf') {
      list = list.filter((m) => !String(m.origenArchivo || '').includes('2022'));
    }

    if (periodFilter !== 'all' && list.length > 0) {
      const latestISO = list[list.length - 1].fechaISO;
      const latestDate = new Date(`${latestISO}T00:00:00`);
      if (periodFilter === '12m') {
        const cutoff = new Date(latestDate);
        cutoff.setFullYear(cutoff.getFullYear() - 1);
        const cutISO = cutoff.toISOString().slice(0, 10);
        list = list.filter((m) => m.fechaISO >= cutISO);
      } else if (periodFilter === '24m') {
        const cutoff = new Date(latestDate);
        cutoff.setFullYear(cutoff.getFullYear() - 2);
        const cutISO = cutoff.toISOString().slice(0, 10);
        list = list.filter((m) => m.fechaISO >= cutISO);
      } else if (/^\d{4}$/.test(periodFilter)) {
        list = list.filter((m) => m.fechaISO.startsWith(periodFilter));
      }
    }
    return list;
  }, [measurements, sourceFilter, periodFilter]);

  const baseRecord = useMemo(() => {
    if (filteredData.length === 0) return null;
    if (compareBaseId) {
      const found = filteredData.find((d) => d.id === compareBaseId);
      if (found) return found;
    }
    return filteredData[0];
  }, [filteredData, compareBaseId]);

  const currentRecord = useMemo(() => {
    if (filteredData.length === 0) return null;
    if (compareCurrentId) {
      const found = filteredData.find((d) => d.id === compareCurrentId);
      if (found) return found;
    }
    return filteredData[filteredData.length - 1];
  }, [filteredData, compareCurrentId]);

  const handleFilesSelected = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    setIsProcessingFiles(true);
    setStatusMessage(null);

    try {
      let addedCount = 0;
      let updatedCount = 0;
      const byIso = new Map(measurements.map((m) => [m.fechaISO, m]));

      for (const file of files) {
        const parsedRecords = await parseUploadedFile(file);
        for (const rec of parsedRecords) {
          if (byIso.has(rec.fechaISO)) {
            updatedCount += 1;
          } else {
            addedCount += 1;
          }
          byIso.set(rec.fechaISO, rec);
        }
      }

      const merged = [...byIso.values()].sort((a, b) => a.fechaISO.localeCompare(b.fechaISO));
      setMeasurements(merged);
      setStatusMessage({
        type: 'success',
        text: `Se procesaron ${files.length} archivo(s) correctamente: ${addedCount} nueva(s) medición(es) y ${updatedCount} actualizada(s).`,
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al procesar el archivo cargado.',
      });
    } finally {
      setIsProcessingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Global drag and drop handlers
  useEffect(() => {
    const onDragOver = (e) => {
      e.preventDefault();
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDraggingGlobal(true);
      }
    };
    const onDragLeave = (e) => {
      if (e.relatedTarget === null) {
        setIsDraggingGlobal(false);
      }
    };
    const onDrop = (e) => {
      e.preventDefault();
      setIsDraggingGlobal(false);
      if (e.dataTransfer?.files?.length) {
        handleFilesSelected(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  });

  const handleSaveManual = (record) => {
    setMeasurements((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      // Also deduplicate by fechaISO if id changed
      for (const [k, v] of map.entries()) {
        if (v.fechaISO === record.fechaISO) map.delete(k);
      }
      map.set(record.id, record);
      return [...map.values()].sort((a, b) => a.fechaISO.localeCompare(b.fechaISO));
    });
    setIsModalOpen(false);
    setEditingRecord(null);
    setStatusMessage({
      type: 'success',
      text: `Medición del ${record.fecha} guardada correctamente.`,
    });
  };

  const handleDeleteRecord = (id) => {
    const target = measurements.find((m) => m.id === id);
    if (!target) return;
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
    setStatusMessage({
      type: 'success',
      text: `Medición del ${target.fecha} eliminada.`,
    });
  };

  const handleResetPreloaded = () => {
    const reset = PRELOADED_MEASUREMENTS.map((m) => enrichMeasurement(m)).sort((a, b) =>
      a.fechaISO.localeCompare(b.fechaISO)
    );
    setMeasurements(reset);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
    setStatusMessage({
      type: 'success',
      text: `Se restauraron las ${reset.length} mediciones históricas precargadas.`,
    });
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(measurements, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `antropometria-historial-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ['fechaISO', 'fecha', 'numeroMedicion', ...METRICS.map((m) => m.key), 'somatoCategoria'];
    const csvRows = [
      headers.join(','),
      ...measurements.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            const str = String(val);
            return str.includes(',') ? `"${str}"` : str;
          })
          .join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `antropometria-historial-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // KPI computations
  const latestRec = filteredData.at(-1) || null;
  const referenceRec =
    kpiCompareMode === 'prev'
      ? filteredData.length >= 2
        ? filteredData[filteredData.length - 2]
        : filteredData[0]
      : filteredData[0];

  const kpiCards = useMemo(() => {
    if (!latestRec) return [];
    const findRefWith = (key) => {
      if (referenceRec && referenceRec[key] != null) return referenceRec;
      return filteredData.find((d) => d[key] != null) || latestRec;
    };

    const items = [
      {
        key: 'peso',
        label: 'Peso Corporal',
        unit: 'kg',
        decimals: 1,
        ideal: 'down',
        subLabel: 'IMC Actual',
        subVal: `${fmt(latestRec.imc, 1)} kg/m²`,
      },
      {
        key: 'suma6Pliegues',
        label: 'Suma 6 Pliegues (ISAK)',
        unit: 'mm',
        decimals: 1,
        ideal: 'down',
        subLabel: 'Suma 8 Pliegues',
        subVal: `${fmt(latestRec.suma8Pliegues, 1)} mm`,
      },
      {
        key: 'grasaPctDurnin',
        label: '% Graso (Durnin & W)',
        unit: '%',
        decimals: 1,
        ideal: 'down',
        subLabel: 'Grasa / Magra D&W',
        subVal: `${fmt(latestRec.grasaKgDurnin, 1)} kg / ${fmt(latestRec.magraKgDurnin, 1)} kg`,
      },
      {
        key: 'grasaPctYuhasz',
        label: '% Graso (Yuhasz Atletas)',
        unit: '%',
        decimals: 1,
        ideal: 'down',
        subLabel: 'Grasa / Magra Yuhasz',
        subVal: `${fmt(latestRec.grasaKgYuhasz, 1)} kg / ${fmt(latestRec.magraKgYuhasz, 1)} kg`,
      },
      {
        key: 'cintura',
        label: 'Cintura (mínima)',
        unit: 'cm',
        decimals: 1,
        ideal: 'down',
        subLabel: 'Caderas / Ind. C-C',
        subVal: `${fmt(latestRec.caderas, 1)} cm (${fmt(latestRec.indCintCad, 2)})`,
      },
      {
        key: 'areaMuscBrazo',
        label: 'Área Muscular Brazo',
        unit: 'mm²',
        decimals: 0,
        ideal: 'up',
        subLabel: 'Somatotipo (E-M-Ec)',
        subVal: `${fmt(latestRec.endo, 1)} - ${fmt(latestRec.meso, 1)} - ${fmt(latestRec.ecto, 1)}`,
      },
    ];

    return items.map((it) => {
      const ref = findRefWith(it.key);
      const currVal = latestRec[it.key];
      const refVal = ref ? ref[it.key] : null;
      const delta = currVal != null && refVal != null ? currVal - refVal : null;
      const isGood =
        delta === null || Math.abs(delta) < 0.01
          ? 'neutral'
          : it.ideal === 'down'
            ? delta < 0
              ? 'good'
              : 'caution'
            : delta > 0
              ? 'good'
              : 'caution';
      return {
        ...it,
        currVal,
        refVal,
        refDate: ref?.fecha || '',
        delta,
        deltaClass: isGood,
      };
    });
  }, [latestRec, referenceRec, filteredData]);

  const categoryMetrics = useMemo(
    () => METRICS.filter((m) => m.category === activeCategory),
    [activeCategory]
  );

  const handleSelectMetricFromKPI = (metricKey) => {
    const m = METRIC_MAP[metricKey];
    if (m) {
      setActiveCategory(m.category);
      setPrimaryMetricKey(m.key);
      setActiveView('evolucion');
    }
  };

  return (
    <div className="app-shell">
      {/* Global Drag & Drop Overlay */}
      {isDraggingGlobal && (
        <div className="global-drop-overlay">
          <div className="global-drop-box">
            <Upload size={44} color="var(--accent-primary)" />
            <h2>Suelta tus informes PDF aquí</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Puedes soltar uno o varios PDFs de Antropometría Nivel 1 / Somatotipo (o respaldos JSON/XLS) para
              indexarlos automáticamente en la línea de tiempo.
            </p>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        id="pdf-upload-input"
        type="file"
        accept=".pdf,.xls,.xlsx,.json,application/pdf,application/json"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      {/* Top Header */}
      <header className="top-header">
        <div className="brand-block">
          <span className="brand-eyebrow">ISAK Nivel 1 · Durnin &amp; Womersley · Yuhasz · Heath &amp; Carter</span>
          <h1 className="brand-title">Antropometría &amp; Evolución Corporal</h1>
          <p className="brand-subtitle">
            Indexador clínico de informes PDF de composición corporal, pliegues cutáneos, perímetros y somatocarta.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            id="btn-upload-pdf"
            className="btn btn-primary"
            disabled={isProcessingFiles}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            {isProcessingFiles ? 'Procesando...' : 'Cargar PDF(s)'}
          </button>

          <button
            type="button"
            id="btn-add-manual"
            className="btn"
            onClick={() => {
              setEditingRecord(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={16} />
            Nueva Medición
          </button>

          <button type="button" id="btn-export-json" className="btn btn-subtle" onClick={handleExportJSON}>
            <Download size={15} />
            JSON
          </button>

          <button type="button" id="btn-export-csv" className="btn btn-subtle" onClick={handleExportCSV}>
            <FileSpreadsheet size={15} />
            CSV
          </button>

          <button
            type="button"
            id="btn-reset-preloaded"
            className="btn btn-subtle"
            title="Restaurar las 31 mediciones precargadas"
            onClick={handleResetPreloaded}
          >
            <RotateCcw size={15} />
            Restaurar Base ({PRELOADED_MEASUREMENTS.length})
          </button>
        </div>
      </header>

      {/* Drag & Drop Quick Upload Strip */}
      <section
        className="upload-strip"
        aria-label="Zona de carga rápida de informes PDF"
        onClick={() => fileInputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        <div className="upload-strip-info">
          <div className="upload-icon-badge">
            <Upload size={20} />
          </div>
          <div className="upload-strip-text">
            <h2>Arrastra nuevos PDFs de Antropometría en cualquier lugar o haz clic aquí para seleccionarlos</h2>
            <p>
              Extrae automáticamente Peso, 8 Pliegues ISAK, 5 Perímetros, Durnin &amp; Womersley, Yuhasz, Área Muscular
              de Brazo y Somatocarta de Heath &amp; Carter (sin guardar datos personales).
            </p>
          </div>
        </div>
        <span className="btn btn-sm btn-primary">Seleccionar archivos PDF / JSON</span>
      </section>

      {/* Status Notification */}
      {statusMessage && (
        <div className={`status-banner ${statusMessage.type}`} role="status">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            aria-label="Cerrar notificación"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Global Timeline & Comparison Control Bar */}
      <section className="control-bar" aria-label="Filtros de periodo y comparación">
        <div className="control-group">
          <span className="control-label">Periodo:</span>
          <div className="chip-group">
            {[
              ['all', 'Todo'],
              ['24m', 'Últ. 2 Años'],
              ['12m', 'Últ. Año'],
              ['2026', '2026'],
              ['2025', '2025'],
              ['2024', '2024'],
              ['2023', '2023'],
              ['2022', '2022'],
            ].map(([id, lbl]) => (
              <button
                key={id}
                type="button"
                id={`period-chip-${id}`}
                className={`chip-btn ${periodFilter === id ? 'active' : ''}`}
                onClick={() => setPeriodFilter(id)}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <span className="control-label">Fuente:</span>
          <div className="chip-group">
            <button
              type="button"
              id="source-chip-all"
              className={`chip-btn ${sourceFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSourceFilter('all')}
            >
              Todas ({measurements.length})
            </button>
            <button
              type="button"
              id="source-chip-pdf"
              className={`chip-btn ${sourceFilter === 'pdf' ? 'active' : ''}`}
              onClick={() => setSourceFilter('pdf')}
            >
              Solo PDFs Nivel 1 ({measurements.filter((m) => !String(m.origenArchivo || '').includes('2022')).length})
            </button>
          </div>

          <span className="control-label" style={{ marginLeft: '0.5rem' }}>
            Deltas KPI:
          </span>
          <div className="chip-group">
            <button
              type="button"
              id="kpi-mode-prev"
              className={`chip-btn ${kpiCompareMode === 'prev' ? 'active' : ''}`}
              onClick={() => setKpiCompareMode('prev')}
            >
              vs. Anterior
            </button>
            <button
              type="button"
              id="kpi-mode-first"
              className={`chip-btn ${kpiCompareMode === 'first' ? 'active' : ''}`}
              onClick={() => setKpiCompareMode('first')}
            >
              vs. Inicio Rango
            </button>
          </div>
        </div>
      </section>

      {/* KPI Strip */}
      {latestRec && (
        <section className="kpi-grid" aria-label="Indicadores clave de la última medición">
          {kpiCards.map((card) => (
            <div
              key={card.key}
              id={`kpi-card-${card.key}`}
              className={`kpi-card ${primaryMetricKey === card.key && activeView === 'evolucion' ? 'active' : ''}`}
              onClick={() => handleSelectMetricFromKPI(card.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleSelectMetricFromKPI(card.key);
              }}
            >
              <div className="kpi-top">
                <span className="kpi-label">{card.label}</span>
                {card.delta !== null && (
                  <span className={`kpi-delta ${card.deltaClass}`}>
                    {card.delta > 0 ? '+' : ''}
                    {fmt(card.delta, card.decimals)} {card.unit}
                  </span>
                )}
              </div>
              <div className="kpi-main-row">
                <div>
                  <span className="kpi-value">{fmt(card.currVal, card.decimals)}</span>
                  <span className="kpi-unit">{card.unit}</span>
                </div>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  vs {card.refDate}: {fmt(card.refVal, card.decimals)}
                </span>
              </div>
              <div className="kpi-sub">
                <span>{card.subLabel}:</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  {card.subVal}
                </strong>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Primary View Navigation */}
      <nav className="view-nav" aria-label="Vistas de análisis antropométrico">
        <button
          type="button"
          id="tab-evolucion"
          className={`view-tab ${activeView === 'evolucion' ? 'active' : ''}`}
          onClick={() => setActiveView('evolucion')}
        >
          <TrendingUp size={16} />
          Evolución Temporal ({filteredData.length})
        </button>
        <button
          type="button"
          id="tab-composicion"
          className={`view-tab ${activeView === 'composicion' ? 'active' : ''}`}
          onClick={() => setActiveView('composicion')}
        >
          <Layers size={16} />
          Durnin &amp; Womersley vs. Yuhasz
        </button>
        <button
          type="button"
          id="tab-pliegues"
          className={`view-tab ${activeView === 'pliegues' ? 'active' : ''}`}
          onClick={() => setActiveView('pliegues')}
        >
          <Activity size={16} />
          Pliegues (8) y Perímetros (5)
        </button>
        <button
          type="button"
          id="tab-somatocarta"
          className={`view-tab ${activeView === 'somatocarta' ? 'active' : ''}`}
          onClick={() => setActiveView('somatocarta')}
        >
          <Compass size={16} />
          Somatocarta Heath &amp; Carter
        </button>
        <button
          type="button"
          id="tab-tabla"
          className={`view-tab ${activeView === 'tabla' ? 'active' : ''}`}
          onClick={() => setActiveView('tabla')}
        >
          <Table2 size={16} />
          Hoja Clínica &amp; Editor
        </button>
      </nav>

      {/* Main Content Area */}
      <main>
        {activeView === 'evolucion' && (
          <section className="panel" aria-label="Gráfico interactivo de evolución en el tiempo">
            <div className="selector-bar">
              {/* Category Selector */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div className="chip-group" role="tablist" aria-label="Categorías de métricas">
                  {METRIC_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      id={`cat-tab-${cat.id}`}
                      className={`chip-btn ${activeCategory === cat.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        const firstInCat = METRICS.find((m) => m.category === cat.id);
                        if (firstInCat) setPrimaryMetricKey(firstInCat.key);
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="control-group">
                  <label
                    htmlFor="secondary-metric-select"
                    style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}
                  >
                    Superponer 2ª métrica:
                  </label>
                  <select
                    id="secondary-metric-select"
                    className="select-input"
                    value={secondaryMetricKey}
                    onChange={(e) => setSecondaryMetricKey(e.target.value)}
                  >
                    <option value="none">— Ninguna (1 eje) —</option>
                    {METRICS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label} ({m.unit || 'índice'})
                      </option>
                    ))}
                  </select>

                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={showMovingAvg}
                      onChange={(e) => setShowMovingAvg(e.target.checked)}
                    />
                    Media móvil
                  </label>
                </div>
              </div>

              {/* Metric Pills for Active Category */}
              <div className="metric-pills">
                {categoryMetrics.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    id={`metric-pill-${m.key}`}
                    className={`metric-pill ${primaryMetricKey === m.key ? 'active' : ''}`}
                    onClick={() => setPrimaryMetricKey(m.key)}
                  >
                    {m.label} {m.unit ? `(${m.unit})` : ''}
                  </button>
                ))}
              </div>
            </div>

            <TimeSeriesChart
              data={filteredData}
              primaryKey={primaryMetricKey}
              secondaryKey={secondaryMetricKey}
              showMovingAverage={showMovingAvg}
              onSelectPoint={(rec) => {
                setEditingRecord(rec);
                setIsModalOpen(true);
              }}
            />

            {/* Small Multiples Grid for all metrics in active category */}
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem' }}>
                  Panel Completo de la Categoría:{' '}
                  {METRIC_CATEGORIES.find((c) => c.id === activeCategory)?.label}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Haz clic en cualquier tarjeta para expandirla en el gráfico principal
                </span>
              </div>
              <div className="small-multiples-grid">
                {categoryMetrics.map((m) => (
                  <MiniSparkChart
                    key={m.key}
                    data={filteredData}
                    metricKey={m.key}
                    isSelected={primaryMetricKey === m.key}
                    onSelect={(k) => setPrimaryMetricKey(k)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {activeView === 'composicion' && <CompositionView data={filteredData} />}

        {activeView === 'pliegues' && (
          <SkinfoldsPerimetersView
            data={filteredData}
            baseRecord={baseRecord}
            currentRecord={currentRecord}
            onChangeBase={setCompareBaseId}
            onChangeCurrent={setCompareCurrentId}
          />
        )}

        {activeView === 'somatocarta' && <SomatocartaView data={filteredData} />}

        {activeView === 'tabla' && (
          <ReportTableAndEditor
            data={filteredData}
            baseRecord={baseRecord}
            currentRecord={currentRecord}
            onChangeBase={setCompareBaseId}
            onChangeCurrent={setCompareCurrentId}
            onEditRecord={(rec) => {
              setEditingRecord(rec);
              setIsModalOpen(true);
            }}
            onDeleteRecord={handleDeleteRecord}
            onNewRecord={() => {
              setEditingRecord(null);
              setIsModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Manual Edit / Create Modal */}
      {isModalOpen && (
        <MeasurementModal
          initialRecord={editingRecord}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRecord(null);
          }}
          onSave={handleSaveManual}
        />
      )}
    </div>
  );
}
