// Definición completa de métricas antropométricas (ISAK Nivel 1 + Heath & Carter + Durnin & Womersley + Yuhasz)
// Sin almacenar ni exponer datos personales (PII).

export const METRIC_CATEGORIES = [
  {
    id: 'composicion',
    label: 'Resumen e Índices',
    description: 'Peso total, IMC, sumatorias de pliegues, relación cintura/cadera y área muscular.',
  },
  {
    id: 'durnin',
    label: 'Durnin & Womersley',
    description: 'Composición corporal general (masa grasa y masa magra en kg y %).',
  },
  {
    id: 'yuhasz',
    label: 'Yuhasz (Atletas)',
    description: 'Ecuación deportiva de 6 pliegues (masa grasa y magra en kg y %).',
  },
  {
    id: 'pliegues',
    label: 'Pliegues Cutáneos (mm)',
    description: 'Los 8 pliegues subcutáneos medidos según protocolo ISAK Nivel 1.',
  },
  {
    id: 'perimetros',
    label: 'Perímetros (cm)',
    description: 'Circunferencias musculares y troncales (brazo, cintura, caderas, pantorrilla).',
  },
  {
    id: 'somatotipo',
    label: 'Somatotipo Heath & Carter',
    description: 'Endomorfia, Mesomorfia, Ectomorfia y coordenadas (X, Y) en la Somatocarta.',
  },
  {
    id: 'oseo',
    label: 'Estructura y Diámetros',
    description: 'Talla corporal y diámetros óseos biepicondilares (humeral y femoral).',
  },
];

export const METRICS = [
  // Composición e Índices
  {
    key: 'peso',
    label: 'Peso Corporal',
    shortLabel: 'Peso',
    unit: 'kg',
    category: 'composicion',
    decimals: 1,
    idealTrend: 'down',
    color: '#0d6e6e',
  },
  {
    key: 'suma6Pliegues',
    label: 'Suma 6 Pliegues',
    shortLabel: 'Σ 6 Pliegues',
    unit: 'mm',
    category: 'composicion',
    decimals: 1,
    idealTrend: 'down',
    color: '#c85a32',
  },
  {
    key: 'suma8Pliegues',
    label: 'Suma 8 Pliegues',
    shortLabel: 'Σ 8 Pliegues',
    unit: 'mm',
    category: 'composicion',
    decimals: 1,
    idealTrend: 'down',
    color: '#d97724',
  },
  {
    key: 'imc',
    label: 'IMC (Índice de Masa Corporal)',
    shortLabel: 'IMC',
    unit: 'kg/m²',
    category: 'composicion',
    decimals: 1,
    idealTrend: 'neutral',
    color: '#3b6998',
  },
  {
    key: 'indCintCad',
    label: 'Índice Cintura / Cadera',
    shortLabel: 'Cint/Cad',
    unit: '',
    category: 'composicion',
    decimals: 2,
    idealTrend: 'down',
    color: '#6c5ce7',
  },
  {
    key: 'areaMuscBrazo',
    label: 'Área Muscular de Brazo',
    shortLabel: 'Área Musc. Brazo',
    unit: 'mm²',
    category: 'composicion',
    decimals: 0,
    idealTrend: 'up',
    color: '#23785a',
  },

  // Durnin & Womersley
  {
    key: 'grasaPctDurnin',
    label: '% Graso (Durnin & Womersley)',
    shortLabel: '% Graso D&W',
    unit: '%',
    category: 'durnin',
    decimals: 1,
    idealTrend: 'down',
    color: '#c85a32',
  },
  {
    key: 'grasaKgDurnin',
    label: 'Masa Grasa (Durnin & Womersley)',
    shortLabel: 'Grasa D&W (kg)',
    unit: 'kg',
    category: 'durnin',
    decimals: 1,
    idealTrend: 'down',
    color: '#d97724',
  },
  {
    key: 'magraKgDurnin',
    label: 'Masa Magra (Durnin & Womersley)',
    shortLabel: 'Magra D&W (kg)',
    unit: 'kg',
    category: 'durnin',
    decimals: 1,
    idealTrend: 'up',
    color: '#23785a',
  },

  // Yuhasz (atletas)
  {
    key: 'grasaPctYuhasz',
    label: '% Graso (Yuhasz Atletas)',
    shortLabel: '% Graso Yuhasz',
    unit: '%',
    category: 'yuhasz',
    decimals: 1,
    idealTrend: 'down',
    color: '#b84a39',
  },
  {
    key: 'grasaKgYuhasz',
    label: 'Masa Grasa (Yuhasz Atletas)',
    shortLabel: 'Grasa Yuhasz (kg)',
    unit: 'kg',
    category: 'yuhasz',
    decimals: 1,
    idealTrend: 'down',
    color: '#e07a5f',
  },
  {
    key: 'magraKgYuhasz',
    label: 'Masa Magra (Yuhasz Atletas)',
    shortLabel: 'Magra Yuhasz (kg)',
    unit: 'kg',
    category: 'yuhasz',
    decimals: 1,
    idealTrend: 'up',
    color: '#1f7a68',
  },

  // Perímetros (cm)
  {
    key: 'brazoRelajado',
    label: 'Perímetro Brazo Relajado',
    shortLabel: 'Brazo Relajado',
    unit: 'cm',
    category: 'perimetros',
    decimals: 1,
    idealTrend: 'up',
    color: '#2b6cb0',
  },
  {
    key: 'brazoFlexionado',
    label: 'Perímetro Brazo Flexionado en Tensión',
    shortLabel: 'Brazo en Tensión',
    unit: 'cm',
    category: 'perimetros',
    decimals: 1,
    idealTrend: 'up',
    color: '#23785a',
  },
  {
    key: 'cintura',
    label: 'Perímetro Cintura (mínima)',
    shortLabel: 'Cintura',
    unit: 'cm',
    category: 'perimetros',
    decimals: 1,
    idealTrend: 'down',
    color: '#c85a32',
  },
  {
    key: 'caderas',
    label: 'Perímetro Caderas (máxima)',
    shortLabel: 'Caderas',
    unit: 'cm',
    category: 'perimetros',
    decimals: 1,
    idealTrend: 'down',
    color: '#8c583a',
  },
  {
    key: 'pantorrillaPerimetro',
    label: 'Perímetro Pantorrilla (máxima)',
    shortLabel: 'Pantorrilla (Perím.)',
    unit: 'cm',
    category: 'perimetros',
    decimals: 1,
    idealTrend: 'up',
    color: '#0d6e6e',
  },

  // Pliegues Cutáneos (mm)
  {
    key: 'triceps',
    label: 'Pliegue Tríceps',
    shortLabel: 'Tríceps',
    unit: 'mm',
    category: 'pliegues',
    decimals: 1,
    idealTrend: 'down',
    color: '#c85a32',
  },
  {
    key: 'subescapular',
    label: 'Pliegue Subescapular',
    shortLabel: 'Subescapular',
    unit: 'mm',
    category: 'pliegues',
    decimals: 1,
    idealTrend: 'down',
    color: '#d97724',
  },
  {
    key: 'biceps',
    label: 'Pliegue Bíceps',
    shortLabel: 'Bíceps',
    unit: 'mm',
    category: 'pliegues',
    decimals: 1,
    idealTrend: 'down',
    color: '#2b6cb0',
  },
  {
    key: 'crestaIliaca',
    label: 'Pliegue Cresta Ilíaca',
    shortLabel: 'Cresta Ilíaca',
    unit: 'mm',
    category: 'pliegues',
    decimals: 1,
    idealTrend: 'down',
    color: '#9c4221',
  },
  {
    key: 'supraespinal',
    label: 'Pliegue Supraespinal',
    shortLabel: 'Supraespinal',
    unit: 'mm',
    category: 'pliegues',
    decimals: 1,
    idealTrend: 'down',
    color: '#b7791f',
  },
  {
    key: 'abdominal',
    label: 'Pliegue Abdominal',
    shortLabel: 'Abdominal',
    unit: 'mm',
    category: 'pliegues',
    decimals: 1,
    idealTrend: 'down',
    color: '#c53030',
  },
  {
    key: 'musloMedial',
    label: 'Pliegue Muslo (medial)',
    shortLabel: 'Muslo Medial',
    unit: 'mm',
    category: 'pliegues',
    decimals: 1,
    idealTrend: 'down',
    color: '#0d6e6e',
  },
  {
    key: 'pantorrillaPliegue',
    label: 'Pliegue Pantorrilla',
    shortLabel: 'Pantorrilla (Pliegue)',
    unit: 'mm',
    category: 'pliegues',
    decimals: 1,
    idealTrend: 'down',
    color: '#23785a',
  },

  // Somatotipo de Heath & Carter
  {
    key: 'endo',
    label: 'Endomorfia (Adiposidad Relativa)',
    shortLabel: 'Endomorfia',
    unit: '',
    category: 'somatotipo',
    decimals: 1,
    idealTrend: 'down',
    color: '#d97724',
  },
  {
    key: 'meso',
    label: 'Mesomorfia (Robustez Músculo-Esquelética)',
    shortLabel: 'Mesomorfia',
    unit: '',
    category: 'somatotipo',
    decimals: 1,
    idealTrend: 'up',
    color: '#2b6cb0',
  },
  {
    key: 'ecto',
    label: 'Ectomorfia (Linearidad Relativa)',
    shortLabel: 'Ectomorfia',
    unit: '',
    category: 'somatotipo',
    decimals: 1,
    idealTrend: 'up',
    color: '#23785a',
  },
  {
    key: 'somatoX',
    label: 'Somatocarta Eje X (Ecto - Endo)',
    shortLabel: 'Eje X Somatocarta',
    unit: '',
    category: 'somatotipo',
    decimals: 2,
    idealTrend: 'neutral',
    color: '#0d6e6e',
  },
  {
    key: 'somatoY',
    label: 'Somatocarta Eje Y (2×Meso - (Ecto + Endo))',
    shortLabel: 'Eje Y Somatocarta',
    unit: '',
    category: 'somatotipo',
    decimals: 2,
    idealTrend: 'up',
    color: '#23785a',
  },

  // Estructura y Diámetros Óseos
  {
    key: 'talla',
    label: 'Talla Corporal',
    shortLabel: 'Talla',
    unit: 'cm',
    category: 'oseo',
    decimals: 1,
    idealTrend: 'neutral',
    color: '#4a5568',
  },
  {
    key: 'humeral',
    label: 'Diámetro Humeral (biepicondilar)',
    shortLabel: 'Diám. Humeral',
    unit: 'cm',
    category: 'oseo',
    decimals: 1,
    idealTrend: 'neutral',
    color: '#4a5568',
  },
  {
    key: 'femoral',
    label: 'Diámetro Femoral (biepicondilar)',
    shortLabel: 'Diám. Femoral',
    unit: 'cm',
    category: 'oseo',
    decimals: 1,
    idealTrend: 'neutral',
    color: '#4a5568',
  },
];

export const METRIC_MAP = Object.fromEntries(METRICS.map((m) => [m.key, m]));

export function classifySomatotype(endo, meso, ecto) {
  if (endo == null || meso == null || ecto == null) return 'Sin clasificar';
  const diffEM = Math.abs(endo - meso);
  const diffME = Math.abs(meso - ecto);
  const diffEE = Math.abs(endo - ecto);

  if (diffEM <= 1 && diffME <= 1 && diffEE <= 1) return 'Central';
  if (meso >= endo && meso >= ecto) {
    if (diffEM <= 0.5 && endo > ecto) return 'Endomorfo-Mesomorfo';
    if (endo - ecto > 0.5) return 'Endo-Mesomorfo';
    if (ecto - endo > 0.5) return 'Ecto-Mesomorfo';
    return 'Mesomorfo Balanceado';
  }
  if (endo >= meso && endo >= ecto) {
    if (diffEM <= 0.5 && meso > ecto) return 'Endomorfo-Mesomorfo';
    if (meso - ecto > 0.5) return 'Meso-Endomorfo';
    if (ecto - meso > 0.5) return 'Ecto-Endomorfo';
    return 'Endomorfo Balanceado';
  }
  if (meso - endo > 0.5) return 'Meso-Ectomorfo';
  if (endo - meso > 0.5) return 'Endo-Ectomorfo';
  return 'Ectomorfo Balanceado';
}

export function enrichMeasurement(raw) {
  const m = { ...raw };
  // Strip any personal data fields if present
  delete m.nombre;
  delete m.edad;
  delete m.profesional;
  delete m.matricula;

  const num = (v) => (v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : null);

  const peso = num(m.peso);
  const talla = num(m.talla) || 189.9;
  const humeral = num(m.humeral);
  const femoral = num(m.femoral);
  const brazoRelajado = num(m.brazoRelajado);
  const brazoFlexionado = num(m.brazoFlexionado);
  const cintura = num(m.cintura);
  const caderas = num(m.caderas);
  const pantorrillaPerimetro = num(m.pantorrillaPerimetro);

  const triceps = num(m.triceps);
  const subescapular = num(m.subescapular);
  const biceps = num(m.biceps);
  const crestaIliaca = num(m.crestaIliaca);
  const supraespinal = num(m.supraespinal);
  const abdominal = num(m.abdominal);
  const musloMedial = num(m.musloMedial);
  const pantorrillaPliegue = num(m.pantorrillaPliegue);

  // Suma 6 pliegues (Tríceps + Subescapular + Supraespinal + Abdominal + Muslo + Pantorrilla)
  let suma6 = num(m.suma6Pliegues);
  if (
    suma6 === null &&
    [triceps, subescapular, supraespinal, abdominal, musloMedial, pantorrillaPliegue].every((x) => x !== null)
  ) {
    suma6 = Number(
      (triceps + subescapular + supraespinal + abdominal + musloMedial + pantorrillaPliegue).toFixed(1)
    );
  }

  // Suma 8 pliegues
  let suma8 = num(m.suma8Pliegues);
  if (
    [triceps, subescapular, biceps, crestaIliaca, supraespinal, abdominal, musloMedial, pantorrillaPliegue].every(
      (x) => x !== null
    )
  ) {
    suma8 = Number(
      (
        triceps +
        subescapular +
        biceps +
        crestaIliaca +
        supraespinal +
        abdominal +
        musloMedial +
        pantorrillaPliegue
      ).toFixed(1)
    );
  }

  // IMC
  let imc = num(m.imc);
  if (imc === null && peso !== null && talla !== null) {
    imc = Number((peso / Math.pow(talla / 100, 2)).toFixed(1));
  }

  // IndCint/Cad
  let indCintCad = num(m.indCintCad);
  if (cintura !== null && caderas !== null && caderas > 0) {
    const exactRatio = Number((cintura / caderas).toFixed(2));
    if (indCintCad === null) indCintCad = exactRatio;
    m.indCintCadExacto = Number((cintura / caderas).toFixed(3));
  }

  // Área Muscular de Brazo (mm²) — fórmula de la planilla con pi = 3.14
  let areaMuscBrazo = num(m.areaMuscBrazo);
  if (areaMuscBrazo === null && brazoRelajado !== null && triceps !== null) {
    areaMuscBrazo = Math.round(Math.pow(brazoRelajado * 10 - 3.14 * triceps, 2) / (4 * 3.14));
  }

  // Yuhasz (atletas)
  let grasaPctYuhasz = num(m.grasaPctYuhasz);
  if (grasaPctYuhasz === null && suma6 !== null) {
    grasaPctYuhasz = Number((0.1051 * suma6 + 2.585).toFixed(1));
  }
  let grasaKgYuhasz = num(m.grasaKgYuhasz);
  if (grasaKgYuhasz === null && peso !== null && grasaPctYuhasz !== null) {
    grasaKgYuhasz = Number(((peso * grasaPctYuhasz) / 100).toFixed(1));
  }
  let magraKgYuhasz = num(m.magraKgYuhasz);
  if (magraKgYuhasz === null && peso !== null && grasaKgYuhasz !== null) {
    magraKgYuhasz = Number((peso - grasaKgYuhasz).toFixed(1));
  }

  // Durnin & Womersley
  let grasaPctDurnin = num(m.grasaPctDurnin);
  let grasaKgDurnin = num(m.grasaKgDurnin);
  let magraKgDurnin = num(m.magraKgDurnin);
  if (grasaKgDurnin === null && peso !== null && grasaPctDurnin !== null) {
    grasaKgDurnin = Number(((peso * grasaPctDurnin) / 100).toFixed(1));
  }
  if (magraKgDurnin === null && peso !== null && grasaKgDurnin !== null) {
    magraKgDurnin = Number((peso - grasaKgDurnin).toFixed(1));
  }

  // Somatotipo de Heath & Carter (Carter & Heath, 1990)
  let endo = num(m.endo);
  let meso = num(m.meso);
  let ecto = num(m.ecto);
  let somatoX = num(m.somatoX);
  let somatoY = num(m.somatoY);
  let somatoOrigen = m.somatoOrigen || (endo !== null ? 'pdf' : 'calculado');

  if (
    (endo === null || meso === null || ecto === null) &&
    [triceps, subescapular, supraespinal, talla, humeral, femoral, brazoFlexionado, pantorrillaPerimetro, pantorrillaPliegue, peso].every(
      (x) => x !== null
    )
  ) {
    const xc = (triceps + subescapular + supraespinal) * (170.18 / talla);
    const endoRaw = -0.7182 + 0.1451 * xc - 0.00068 * xc * xc + 0.0000014 * xc * xc * xc;
    const mesoRaw =
      0.858 * humeral +
      0.601 * femoral +
      0.188 * (brazoFlexionado - triceps / 10) +
      0.161 * (pantorrillaPerimetro - pantorrillaPliegue / 10) -
      0.131 * talla +
      4.5;
    const hwr = talla / Math.cbrt(peso);
    const ectoRaw = hwr >= 40.75 ? 0.732 * hwr - 28.58 : hwr > 38.25 ? 0.463 * hwr - 17.63 : 0.1;

    if (endo === null) endo = Number(endoRaw.toFixed(1));
    if (meso === null) meso = Number(mesoRaw.toFixed(1));
    if (ecto === null) ecto = Number(ectoRaw.toFixed(1));
    if (somatoX === null) somatoX = Number((ectoRaw - endoRaw).toFixed(2));
    if (somatoY === null) somatoY = Number((2 * mesoRaw - (ectoRaw + endoRaw)).toFixed(2));
  } else if (endo !== null && meso !== null && ecto !== null) {
    if (somatoX === null) somatoX = Number((ecto - endo).toFixed(2));
    if (somatoY === null) somatoY = Number((2 * meso - (ecto + endo)).toFixed(2));
  }

  return {
    id: m.id || `med-${m.fechaISO}`,
    fechaISO: m.fechaISO,
    fecha: m.fecha,
    numeroMedicion: m.numeroMedicion != null ? Number(m.numeroMedicion) : null,
    origenArchivo: m.origenArchivo || 'PDF Nivel 1',
    peso,
    talla,
    humeral,
    femoral,
    brazoRelajado,
    brazoFlexionado,
    cintura,
    caderas,
    pantorrillaPerimetro,
    triceps,
    subescapular,
    biceps,
    crestaIliaca,
    supraespinal,
    abdominal,
    musloMedial,
    pantorrillaPliegue,
    imc,
    indCintCad,
    suma6Pliegues: suma6,
    suma8Pliegues: suma8,
    grasaPctDurnin,
    grasaKgDurnin,
    magraKgDurnin,
    grasaPctYuhasz,
    grasaKgYuhasz,
    magraKgYuhasz,
    areaMuscBrazo,
    endo,
    meso,
    ecto,
    somatoX,
    somatoY,
    somatoOrigen,
    somatoCategoria: classifySomatotype(endo, meso, ecto),
  };
}
