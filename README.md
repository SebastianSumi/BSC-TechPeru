# BSC TechPeru SAC 2025 — Demo Interactiva del Balanced Scorecard

Demo web interactiva que transforma el libro de Excel **Balanced Scorecard (BSC) de TechPeru SAC 2025** en un tablero de control navegable, con semáforo automático, vista por perspectiva y un **simulador de escenarios en tiempo real**.

> **Modelo:** 4 perspectivas · 12 objetivos estratégicos · 36 KPIs
> **Índice global de cumplimiento (datos del Excel):** `84.2%` → 11 ✅ LOGRADO · 19 ⚠️ EN RIESGO · 6 ❌ CRÍTICO

---

## Tabla de contenidos

- [1. Origen de los datos: el Excel](#1-origen-de-los-datos-el-excel)
- [2. Cómo se implementó el Excel en la demo](#2-cómo-se-implementó-el-excel-en-la-demo)
  - [2.1 Reglas de negocio portadas](#21-reglas-de-negocio-portadas)
  - [2.2 KPIs inversos](#22-kpis-inversos)
  - [2.3 Estructura del modelo de datos](#23-estructura-del-modelo-de-datos)
- [3. Arquitectura de la aplicación](#3-arquitectura-de-la-aplicación)
- [4. Funcionalidades de la demo](#4-funcionalidades-de-la-demo)
- [5. Cómo ejecutar el proyecto](#5-cómo-ejecutar-el-proyecto)
- [6. Verificación](#6-verificación)
- [7. Roadmap](#7-roadmap)

---

## 1. Origen de los datos: el Excel

El punto de partida es el archivo `BSC_TechPeru_Ampliado_2025.xlsx`, que contiene 7 hojas:

| Hoja | Contenido |
|------|-----------|
| 🏠 Portada | Índice y guía de uso del libro |
| 📊 BSC Completo | Los 36 KPIs con `Meta`, `Real`, `% Cumpl.` y `Estado` |
| 💰 Financiera | 3 objetivos · 9 KPIs + análisis/acción recomendada |
| 👥 Clientes | 3 objetivos · 9 KPIs + análisis/acción recomendada |
| 🔧 Procesos | 3 objetivos · 9 KPIs + análisis/acción recomendada |
| 📚 Aprendizaje | 3 objetivos · 9 KPIs + análisis/acción recomendada |
| 📈 Dashboard | Semáforo ejecutivo global y ranking de KPIs |

Cada fila de KPI en el Excel tiene la forma:

```
Perspectiva | Objetivo Estratégico | Indicador (KPI) | Unidad | Meta | Real | % Cumpl. | Estado
```

El Excel calcula `% Cumplimiento` y clasifica `Estado` con fórmulas. La demo **replica exactamente esa lógica en código TypeScript** y añade interactividad.

---

## 2. Cómo se implementó el Excel en la demo

### 2.1 Reglas de negocio portadas

Las fórmulas del Excel se tradujeron a la librería `src/lib/bsc.ts`:

| Regla del Excel | Implementación | Archivo |
|-----------------|----------------|---------|
| `% Cumpl. = Real / Meta × 100` (KPI normal) | `calcularCumplimiento()` | `src/lib/bsc.ts` |
| `% Cumpl. = Meta / Real × 100` (KPI inverso) | `calcularCumplimiento()` | `src/lib/bsc.ts` |
| Verde ≥ 90% | `clasificarEstado()` → `logrado` | `src/lib/bsc.ts` |
| Ámbar 75–89% | `clasificarEstado()` → `riesgo` | `src/lib/bsc.ts` |
| Rojo < 75% | `clasificarEstado()` → `critico` | `src/lib/bsc.ts` |
| Índice global (promedio de los 36 KPIs) | `resumen()` | `src/lib/bsc.ts` |
| Promedio por perspectiva | `resumenPorPerspectiva()` | `src/lib/bsc.ts` |

Fragmento clave:

```ts
export function calcularCumplimiento(meta: number, real: number, inverso: boolean): number {
  if (real === 0) return 0
  const pct = inverso ? (meta / real) * 100 : (real / meta) * 100
  return Math.round(pct * 10) / 10
}

export function clasificarEstado(pct: number): Estado {
  if (pct >= 90) return 'logrado'
  if (pct >= 75) return 'riesgo'
  return 'critico'
}
```

### 2.2 KPIs inversos

En el Excel, algunos KPIs son **inversos** (menor valor = mejor resultado): costos, defectos, rotación, tiempos, incidencias, etc. Para ellos el cumplimiento se calcula como `Meta / Real × 100`.

En el modelo de datos esto se marca con el flag `inverso: true`. Ejemplos:

- `Churn Rate (Tasa de Abandono)` → meta 5%, real 7.2% → `5 / 7.2 × 100 = 69.4%` ❌
- `Costo de Adquisición de Cliente (CAC)` → meta S/350, real S/412 → `350 / 412 × 100 = 85.0%` ⚠️
- `Tiempo de Resolución de Quejas` → meta 2 días, real 2.8 → `2 / 2.8 × 100 = 71.4%` ❌

### 2.3 Estructura del modelo de datos

Los 36 KPIs se transcribieron desde el Excel a `src/data/kpis.ts` como un arreglo tipado. Cada KPI incluye además el texto de **"Análisis / Acción Recomendada"** que aparece en las hojas de perspectiva del Excel, para mostrarlo en el modal de detalle.

```ts
export interface Kpi {
  id: string
  perspectiva: 'financiera' | 'clientes' | 'procesos' | 'aprendizaje'
  objetivo: string
  nombre: string
  unidad: string
  meta: number
  real: number          // ← valor editable en el simulador
  inverso: boolean      // ← true si menor es mejor
  accion: string        // ← análisis/acción recomendada del Excel
}
```

---

## 3. Arquitectura de la aplicación

Demo **frontend-only** (sin backend): los datos viven localmente y toda la lógica de negocio se ejecuta en el navegador, lo que la hace instantánea y portable.

```
frontend/
├── index.html
├── vite.config.ts            # Vite + Tailwind v4
└── src/
    ├── main.tsx
    ├── App.tsx               # Layout, navegación por tabs y vistas
    ├── index.css             # Tailwind + tema oscuro
    ├── data/
    │   ├── types.ts          # Tipos: Kpi, Perspectiva, Estado, ResumenEstado
    │   └── kpis.ts           # Los 36 KPIs + metadatos de las 4 perspectivas
    ├── lib/
    │   └── bsc.ts            # Reglas de negocio (cálculo %, estado, índice global)
    ├── store/
    │   └── useBsc.ts         # Estado reactivo (simulador: editar Real, reset)
    └── components/
        ├── SemaforoDonut.tsx     # Donut del semáforo global (11/19/6)
        ├── RadarPerspectivas.tsx # Radar de cumplimiento por perspectiva
        ├── MetaRealChart.tsx     # Barras Meta vs Real de los 36 KPIs
        ├── KpiCard.tsx           # Tarjeta de KPI
        ├── KpiModal.tsx          # Detalle + acción recomendada
        ├── EstadoBadge.tsx       # Badge y barra de cumplimiento
        └── SimuladorPanel.tsx    # Sliders para editar el valor Real
```

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Recharts · lucide-react.

---

## 4. Funcionalidades de la demo

1. **Dashboard ejecutivo** — índice global, donut de semáforo (✅/⚠️/❌), radar por perspectiva, tarjetas resumen de las 4 perspectivas y gráfico Meta vs Real de los 36 KPIs.
2. **Vistas de perspectiva** — Financiera, Clientes, Procesos y Aprendizaje, agrupadas por objetivo estratégico.
3. **Explorador de KPIs** — los 36 indicadores como tarjetas con barra de cumplimiento y badge de estado.
4. **Modal de detalle** — al hacer clic en un KPI: meta, real, % cumplimiento, indicador inverso y el análisis/acción recomendada del Excel.
5. **Simulador de escenarios** ⚡ — desliza el valor `Real` de cualquier KPI y observa cómo se recalcula **en vivo** el cumplimiento, el estado y el índice global. Botón para restaurar los valores originales del Excel.

---

## 5. Cómo ejecutar el proyecto

### Requisitos

- **Node.js 18+** (probado con Node 22) y npm.

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/<tu-usuario>/BSC-TechPeru.git
cd BSC-TechPeru/frontend

# 2. Instalar dependencias
npm install

# 3. Levantar el servidor de desarrollo
npm run dev
```

Abre la URL que muestra la consola (por defecto `http://localhost:5173/`).

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Compila para producción en `dist/` |
| `npm run preview` | Previsualiza el build de producción |
| `npm run lint` | Ejecuta oxlint |

### Despliegue (opcional)

El build es 100% estático, por lo que puede publicarse en GitHub Pages, Vercel, Netlify o cualquier hosting de archivos estáticos:

```bash
npm run build      # genera ./dist
```

---

## 6. Verificación

La demo reproduce con exactitud los resultados del Excel. Con los datos originales:

| Métrica | Valor esperado (Excel) | Valor en la demo |
|---------|------------------------|------------------|
| Total de KPIs | 36 | 36 |
| Índice global de cumplimiento | 84.2% | **84.2%** |
| ✅ LOGRADO (≥90%) | 11 | 11 |
| ⚠️ EN RIESGO (75–89%) | 19 | 19 |
| ❌ CRÍTICO (<75%) | 6 | 6 |

Puedes comprobarlo cambiando a la pestaña **Simulador** y pulsando **Restaurar**, o ejecutando:

```bash
npm run build && npm run lint
```

---

## 7. Roadmap

- [ ] **Fase 1 (actual):** demo frontend-only con datos locales y simulador en vivo.
- [ ] **Fase 2:** backend con **NestJS + Prisma + PostgreSQL** para persistir KPIs y guardar escenarios del simulador.
- [ ] **Fase 3:** autenticación, carga de datos reales desde Excel/CSV e histórico por trimestres.
- [ ] **Fase 4:** exportación de reportes (PDF) y alertas automáticas.
