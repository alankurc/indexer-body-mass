import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import * as XLSX from 'xlsx';
import { enrichMeasurement } from './anthropometryMath.js';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

function parseNum(str) {
  if (str === null || str === undefined) return null;
  const cleaned = String(str).trim().replace(',', '.');
  const val = Number.parseFloat(cleaned);
  return Number.isFinite(val) ? val : null;
}

export function normalizeDate(dateStr, fallbackFileName = '') {
  if (dateStr) {
    const parts = String(dateStr).trim().split(/[/.-]/);
    if (parts.length === 3) {
      let d = Number.parseInt(parts[0], 10);
      let m = Number.parseInt(parts[1], 10);
      let y = Number.parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      if (d > 1900) {
        const tmp = d;
        d = y;
        y = tmp;
      }
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 2000 && y <= 2100) {
        const iso = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const display = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${String(y).padStart(4, '0')}`;
        return { fechaISO: iso, fecha: display };
      }
    }
  }
  const fnMatch = fallbackFileName.match(/(\d{2})[-.](\d{2})[-.](\d{2})/);
  if (fnMatch) {
    const p1 = Number.parseInt(fnMatch[1], 10);
    const p2 = Number.parseInt(fnMatch[2], 10);
    const p3 = Number.parseInt(fnMatch[3], 10);
    const y = 2000 + p1;
    const m = p2;
    const d = p3;
    const iso = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const display = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${String(y).padStart(4, '0')}`;
    return { fechaISO: iso, fecha: display };
  }
  const today = new Date().toISOString().slice(0, 10);
  const [y, m, d] = today.split('-');
  return { fechaISO: today, fecha: `${d}/${m}/${y}` };
}

/**
 * Reconstructs visual lines from pdf.js textContent items by grouping items with similar Y coordinates
 * and sorting left-to-right by X coordinate.
 */
export function reconstructLinesFromItems(items) {
  const valid = items
    .filter((it) => it && typeof it.str === 'string' && it.str.trim().length > 0 && Array.isArray(it.transform))
    .map((it) => ({
      str: it.str.trim(),
      x: it.transform[4],
      y: it.transform[5],
    }));

  valid.sort((a, b) => b.y - a.y || a.x - b.x);

  const rows = [];
  const Y_TOLERANCE = 4.2;

  for (const item of valid) {
    let row = rows.find((r) => Math.abs(r.y - item.y) <= Y_TOLERANCE);
    if (!row) {
      row = { y: item.y, items: [] };
      rows.push(row);
    }
    row.items.push(item);
  }

  return rows
    .sort((a, b) => b.y - a.y)
    .map((r) => {
      r.items.sort((a, b) => a.x - b.x);
      return r.items.map((i) => i.str).join('   ');
    })
    .join('\n');
}

/**
 * Parses reconstructed text from an ISAK Nivel 1 / Heath & Carter PDF report.
 * Personal data (Nombre, Edad, Profesional, MP) is intentionally ignored/stripped.
 */
export function parseAnthropometryText(text, fileName = '') {
  const findVal = (regex) => {
    const match = text.match(regex);
    return match ? parseNum(match[1]) : null;
  };

  const dateMatch = text.match(/Fecha\s+de\s+medici[óo]n:\s*(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})/i);
  const { fechaISO, fecha } = normalizeDate(dateMatch ? dateMatch[1] : null, fileName);

  const numMatch = text.match(/N[úu]mero\s+de\s+medici[óo]n:\s*(\d+)/i);
  const numeroMedicion = numMatch ? Number.parseInt(numMatch[1], 10) : null;

  const dwMatch = text.match(
    /%\s*graso\s+Durnin\s*&\s*W\s+([\d,]+(?:\.\d+)?)[\s\S]*?Grasa\s+kg\s+([\d,]+(?:\.\d+)?)[\s\S]*?Magra\s+kg\s+([\d,]+(?:\.\d+)?)/i
  );
  const yuhMatch = text.match(
    /%\s*graso\s+Yuhasz\s*\(atletas\)\s+([\d,]+(?:\.\d+)?)[\s\S]*?Grasa\s+kg\s+([\d,]+(?:\.\d+)?)[\s\S]*?Magra\s+kg\s+([\d,]+(?:\.\d+)?)/i
  );

  const somatoRatingMatch = text.match(
    /RATING\s+DE\s+SOMATOTIPO\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)/i
  );
  const somatoX = findVal(/X\s*\(ecto-endo\):\s*([-\d,]+(?:\.\d+)?)/i);
  const somatoY = findVal(/Y\s*\(2\*meso-\(ecto\+endo\)\):\s*([-\d,]+(?:\.\d+)?)/i);

  const raw = {
    id: `med-${fechaISO}`,
    fechaISO,
    fecha,
    numeroMedicion: numeroMedicion && numeroMedicion > 0 ? numeroMedicion : null,
    origenArchivo: 'PDF Nivel 1',
    peso: findVal(/Peso\s*\(kg\)\s+([\d,]+(?:\.\d+)?)/i),
    talla: findVal(/Talla\s*\(cm\)\s+([\d,]+(?:\.\d+)?)/i),
    humeral: findVal(/Humeral\s*\(biepicondilar\)\s+([\d,]+(?:\.\d+)?)/i),
    femoral: findVal(/Femoral\s*\(biepicondilar\)\s+([\d,]+(?:\.\d+)?)/i),
    brazoRelajado: findVal(/Brazo\s+Relajado\s+([\d,]+(?:\.\d+)?)/i),
    brazoFlexionado: findVal(/Brazo\s+Flexionado\s+en\s+Tensi[óo]n?\s+([\d,]+(?:\.\d+)?)/i),
    cintura: findVal(/Cintura\s*\(m[íi]nima\)\s+([\d,]+(?:\.\d+)?)/i),
    caderas: findVal(/Caderas\s*\(m[áa]xima\)\s+([\d,]+(?:\.\d+)?)/i),
    pantorrillaPerimetro: findVal(/Pantorrilla\s*\(m[áa]xima\)\s+([\d,]+(?:\.\d+)?)/i),
    triceps: findVal(/Tr[íi]ceps\s+([\d,]+(?:\.\d+)?)/i),
    subescapular: findVal(/Subescapular\s+([\d,]+(?:\.\d+)?)/i),
    biceps: findVal(/B[íi]ceps\s+([\d,]+(?:\.\d+)?)/i),
    crestaIliaca: findVal(/Cresta\s+Il[íi]aca\s+([\d,]+(?:\.\d+)?)/i),
    supraespinal: findVal(/Supraespinal\s+([\d,]+(?:\.\d+)?)/i),
    abdominal: findVal(/Abdominal\s+([\d,]+(?:\.\d+)?)/i),
    musloMedial: findVal(/Muslo\s*\(medial\)\s+([\d,]+(?:\.\d+)?)/i),
    pantorrillaPliegue: findVal(/^\s*Pantorrilla\s+([\d,]+(?:\.\d+)?)/im),
    imc: findVal(/IMC\s+kg\/m\s*(?:-2|2)?\s+([\d,]+(?:\.\d+)?)/i),
    indCintCad: findVal(/IndCint\/Cad\s+([\d,]+(?:\.\d+)?)/i),
    suma6Pliegues: findVal(/Suma\s+6\s+pl\s+mm\s+([\d,]+(?:\.\d+)?)/i),
    grasaPctDurnin: dwMatch ? parseNum(dwMatch[1]) : null,
    grasaKgDurnin: dwMatch ? parseNum(dwMatch[2]) : null,
    magraKgDurnin: dwMatch ? parseNum(dwMatch[3]) : null,
    grasaPctYuhasz: yuhMatch ? parseNum(yuhMatch[1]) : null,
    grasaKgYuhasz: yuhMatch ? parseNum(yuhMatch[2]) : null,
    magraKgYuhasz: yuhMatch ? parseNum(yuhMatch[3]) : null,
    areaMuscBrazo: findVal(/Area\s+Musc\s+Brazo\s*(?:mm\s*2?)?\s+([\d,]+(?:\.\d+)?)/i),
    endo: somatoRatingMatch ? parseNum(somatoRatingMatch[1]) : null,
    meso: somatoRatingMatch ? parseNum(somatoRatingMatch[2]) : null,
    ecto: somatoRatingMatch ? parseNum(somatoRatingMatch[3]) : null,
    somatoX,
    somatoY,
    somatoOrigen: somatoRatingMatch ? 'pdf' : 'calculado',
  };

  return enrichMeasurement(raw);
}

/**
 * Extracts and parses an uploaded PDF, XLS/XLSX, or JSON file in the browser.
 * Returns an array of enriched measurement records.
 */
export async function parseUploadedFile(file) {
  const name = file.name || '';
  const lower = name.toLowerCase();

  if (lower.endsWith('.json')) {
    const text = await file.text();
    const data = JSON.parse(text);
    const list = Array.isArray(data) ? data : data.measurements || [data];
    return list.map((item) => enrichMeasurement(item));
  }

  if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sh = wb.Sheets['Proc datos brutos'] || wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: null });

    const findRowVal = (label) => {
      const r = rows.find(
        (row) => row && typeof row[0] === 'string' && row[0].toLowerCase().includes(label.toLowerCase())
      );
      return r && typeof r[1] === 'number' ? r[1] : null;
    };

    const { fechaISO, fecha } = normalizeDate(null, name);
    const raw = {
      id: `med-${fechaISO}`,
      fechaISO,
      fecha,
      numeroMedicion: null,
      origenArchivo: 'Planilla ISAK (XLS)',
      peso: findRowVal('Peso Bruto') ?? findRowVal('Peso (kg)'),
      talla: findRowVal('Talla Corporal') ?? findRowVal('Talla (cm)'),
      humeral: findRowVal('Humeral'),
      femoral: findRowVal('Femoral'),
      brazoRelajado: findRowVal('Brazo Relajado'),
      brazoFlexionado: findRowVal('Brazo Flexionado'),
      cintura: findRowVal('Cintura'),
      caderas: findRowVal('Caderas'),
      pantorrillaPerimetro:
        rows.find((row, idx) => idx < 26 && row && String(row[0]).includes('Pantorrilla'))?.[1] ?? null,
      triceps: findRowVal('Tríceps'),
      subescapular: findRowVal('Subescapular'),
      biceps: findRowVal('Bíceps'),
      crestaIliaca: findRowVal('Cresta'),
      supraespinal: findRowVal('Supraespinal'),
      abdominal: findRowVal('Abdominal'),
      musloMedial: findRowVal('Muslo'),
      pantorrillaPliegue:
        rows.find((row, idx) => idx >= 26 && row && String(row[0]).includes('Pantorrilla'))?.[1] ?? null,
      somatoOrigen: 'calculado',
    };
    return [enrichMeasurement(raw)];
  }

  // Default: PDF file
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;

  let fullText = '';
  for (let p = 1; p <= pdfDoc.numPages; p += 1) {
    const page = await pdfDoc.getPage(p);
    const textContent = await page.getTextContent();
    fullText += `${reconstructLinesFromItems(textContent.items)}\n`;
  }

  const parsed = parseAnthropometryText(fullText, name);
  if (!parsed.peso && !parsed.suma6Pliegues && !parsed.imc) {
    throw new Error(
      `No se detectaron campos antropométricos válidos en "${name}". Verifica que el PDF sea un informe de composición corporal.`
    );
  }
  return [parsed];
}
