# Antropometría & Evolución Corporal (ISAK Nivel 1 · Somatocarta)

Aplicación web estática diseñada para alojarse en **GitHub Pages** que permite arrastrar o seleccionar informes PDF de **Composición Corporal Nivel 1** y **Somatotipo de Heath & Carter** (además de planillas `.xls`/`.xlsx` o respaldos `.json`) para indexarlos automáticamente y visualizar la evolución de todas las variables en el tiempo.

## Características Principales

- **Extracción Automática de PDF en el Navegador (`pdf.js`)**:
  - Lee directamente tanto informes de 1 página (*Informe de Composición Corporal Nivel 1*) como de 2 páginas (incluyendo *Somatotipo de Heath & Carter*).
  - **Privacidad por diseño**: Omite y descarta cualquier dato personal (nombre, edad, profesional o matrícula) al indexar y persistir las mediciones.
- **31 Mediciones Históricas Precargadas (2022–2026)**:
  - Incluye las 26 mediciones de informes PDF Nivel 1 y las 5 mediciones de planillas ISAK de 2022, 100% anonimizadas.
- **Todas las Variables del Informe Indexadas**:
  - **Básicos y Diámetros Óseos**: Peso (`kg`), Talla (`cm`), Humeral biepicondilar (`cm`), Femoral biepicondilar (`cm`).
  - **5 Perímetros (`cm`)**: Brazo Relajado, Brazo Flexionado en Tensión, Cintura Mínima, Caderas Máxima, Pantorrilla Máxima.
  - **8 Pliegues Cutáneos (`mm`)**: Tríceps, Subescapular, Bíceps, Cresta Ilíaca, Supraespinal, Abdominal, Muslo Medial, Pantorrilla.
  - **Índices y Composición Corporal**:
    - IMC (`kg/m²`), Índice Cintura/Cadera, Suma de 6 Pliegues (`mm`), Suma de 8 Pliegues (`mm`), Área Muscular de Brazo (`mm²`).
    - **Durnin & Womersley**: `% Graso`, `Masa Grasa (kg)`, `Masa Magra (kg)`.
    - **Yuhasz (Atletas)**: `% Graso`, `Masa Grasa (kg)`, `Masa Magra (kg)`.
  - **Somatotipo de Heath & Carter**:
    - `Endomorfia`, `Mesomorfia`, `Ectomorfia`, coordenadas `(X, Y)` de la Somatocarta y tabla interactiva de la *Escala de Rating y Características (Carter y Heath, 1990)*.
- **Persistencia Local y Portabilidad**:
  - Guardado automático en `LocalStorage`, edición manual de cualquier registro y exportación/importación en **JSON** y **CSV**.

## Desarrollo Local

```bash
npm install
npm run dev
```

## Despliegue en GitHub Pages

El repositorio incluye el workflow `.github/workflows/deploy.yml` que compila y publica automáticamente la aplicación en GitHub Pages en cada push a la rama `main`.
