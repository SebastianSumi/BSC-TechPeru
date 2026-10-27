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
- [Documentación adicional (`docs/`)](#documentación-adicional-docs)
  - [`docs/arquitectura.md`](docs/arquitectura.md) — Sección 3 ampliada: árbol de módulos NestJS, capa de servicios (`/iniciativas`, `/alertas`, `/auditoria`, `/importacion`) y cobertura de los 10 módulos
  - [`docs/modulos-4-6-9-10.md`](docs/modulos-4-6-9-10.md) — especificaciones formales de los módulos 4, 6, 9 y 10
  - [`docs/roadmap.md`](docs/roadmap.md) — detalle de las fases 4 y 5

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
  perspectivaId: 'financiera' | 'clientes' | 'procesos' | 'aprendizaje'
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

Proyecto **full-stack**:

- **Frontend** (React + Vite): la lógica de negocio BSC y la UI. Si el API no está disponible, funciona igual con datos locales (modo offline).
- **Backend** (NestJS + Prisma + PostgreSQL): sirve los 36 KPIs desde la base de datos, autentica usuarios, gestiona períodos/asignaciones y persiste las ediciones del simulador.

```
BSC-TechPeru/
├── docs/                    # Documentación adicional (arquitectura, módulos, roadmap)
├── frontend/                 # React 19 + Vite + Tailwind v4 + Recharts
│   └── src/
│       ├── App.tsx           # Layout, navegación por tabs y vistas
│       ├── data/             # types.ts (tipos) + kpis.ts (36 KPIs, fallback offline)
│       ├── lib/              # bsc.ts (reglas de negocio) + api.ts (cliente HTTP)
│       ├── store/
│       │   ├── useAuth.tsx   # AuthProvider, login/logout y `puede()` por rol
│       │   └── useBsc.ts     # Estado reactivo por período; API con fallback local
│       └── components/       # Login, Reportes, AdminPanel, PeriodoSelector,
│                             #   Donut, radar, chart, tarjetas, modal y simulador
│
└── backend/                  # NestJS + Prisma + PostgreSQL
    ├── prisma/
    │   ├── schema.prisma     # Modelos + enums (RolNombre)
    │   ├── seed.mjs          # Roles, usuarios, períodos, asignaciones y mediciones
    │   └── seed-data.mjs     # Datos extraídos del Excel
    └── src/
        ├── prisma/           # PrismaService + PrismaModule (global)
        ├── comun/            # AccesoService (visibilidad por rol y compañía)
        ├── auth/             # JWT, guards globales (@Roles/@Public), usuarios y roles
        ├── empresas/         # Perfiles de compañía (TechPeru, Nova Retail, Andes Salud)
        ├── periodos/         # CRUD de períodos + activación
        ├── asignaciones/     # Asignación de objetivos a usuarios
        ├── config/           # Umbrales, formato, agregación y notificarCriticos
        ├── catalogos/        # Catálogos (perspectivas y objetivos base)
        ├── objetivos/        # Objetivos estratégicos
        ├── indicadores/      # Diccionario de indicadores (KPI), equipo y mediciones
        ├── cumplimiento/     # Reglas de cumplimiento por compañía (evaluar/reglas)
        ├── bsc/              # Lógica BSC: resumen, reportes e índices
        ├── iniciativas/      # Módulo 4: proyectos asociados a objetivos (presupuesto/avance)
        ├── tareas/           # Módulo 4: actividades, resultados y validaciones
        ├── calendario/       # Módulo 4: hitos y fechas clave
        ├── alertas/          # Módulo 6: motor de alertas automáticas por KPI crítico
        ├── auditoria/        # Módulo 9: log de cambios (quién/cuándo/qué)
        ├── importacion/      # Módulo 10: carga masiva de mediciones (CSV/JSON)
        ├── reportes/         # Módulo 10: reportes por objetivo + exportación CSV
        ├── evidencias/       # Evidencias con almacenamiento de archivos
        ├── desviaciones/     # Análisis de desviaciones
        ├── recomendaciones/  # Recomendaciones del plan
        ├── compromisos/      # Compromisos de reuniones
        ├── aprobaciones/     # Flujo de aprobación del plan
        ├── versiones/        # Versiones/snapshots del plan estratégico
        ├── mapa/             # Mapa estratégico y relaciones causales
        └── main.ts           # Bootstrap + CORS
```

**Stack frontend:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Recharts · lucide-react.
**Stack backend:** NestJS · Prisma ORM · PostgreSQL · Passport/JWT (roles).

> El árbol completo, la capa de servicios y la cobertura de los 10 módulos del diagrama
> funcional están en [`docs/arquitectura.md`](docs/arquitectura.md).

### Capa de servicios adicionales

| Módulo | Rutas | Función |
|--------|-------|---------|
| **Gestión de iniciativas** (4) | `/iniciativas` | CRUD de proyectos ligados a objetivos: fechas, responsable, presupuesto y avance; actividades en `/tareas`, hitos en `/calendario` |
| **Alertas automáticas** (6) | `/alertas`, `/alertas/generar` | Motor por período (KPIs críticos, sin duplicados, severidad) y ciclo de vida NUEVA→RECONOCIDA→RESUELTA/DESCARTADA |
| **Auditoría** (9) | `/auditoria` | Registro `quién/cuándo/qué` en 16 servicios (44 puntos); lectura filtrable para ADMIN/GERENTE |
| **Importación** (10) | `/importacion/mediciones` | Carga masiva de mediciones (CSV o filas JSON) con validación por fila y reporte de errores |

Endpoints detallados con roles: [`docs/arquitectura.md`](docs/arquitectura.md#3-endpoints-por-módulo).


### Modelo de datos (backend)

| Modelo | Descripción |
|--------|-------------|
| `Empresa` | Perfiles de compañía (TechPeru, Nova Retail, Andes Salud) con sigla, sector y color |
| `Rol` | ADMIN, GERENTE, ANALISTA, RESPONSABLE |
| `Usuario` | Credenciales (bcrypt) + rol |
| `Perspectiva` / `Kpi` | Catálogo del BSC (4 perspectivas, 36 KPIs) |
| `Periodo` | Trimestres por compañía (`@@unique([empresaId, nombre])`) con bandera `activo` |
| `Medicion` | Valor `meta`/`real` de un KPI **en un período** (histórico) |
| `Asignacion` | Objetivo (KPI) asignado a un usuario responsable |
| `Iniciativa` | Proyecto ligado a un objetivo: fechas, responsable, presupuesto, avance, estado |
| `Tarea` / `ResultadoTarea` | Actividades del plan, con entregables validables y evidencias |
| `Alerta` | Alertas por KPI crítico o manuales: severidad, estado, destinatario, leída |
| `Auditoria` | Log de cambios: usuario, acción, entidad, `entidadId` y `detalle` (JSON) |

### Roles y permisos

| Rol | Puede |
|-----|-------|
| **ADMIN** | Todo: usuarios, roles, períodos, KPIs, mediciones y reportes |
| **GERENTE** | Gestiona períodos, asignaciones, mediciones y reportes; ve usuarios |
| **ANALISTA** | Registra mediciones y genera reportes |
| **RESPONSABLE** | Ve y reporta **solo sus objetivos asignados** |

### API REST

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/` | público | Health check |
| `POST` | `/auth/login` | público | Login → `accessToken` (JWT) |
| `GET` | `/auth/me` | autenticado | Usuario actual |
| `GET` | `/auth/roles` | autenticado | Catálogo de roles |
| `GET` | `/auth/usuarios` | ADMIN, GERENTE | Lista usuarios |
| `POST` | `/auth/usuarios` | ADMIN | Crea usuario |
| `PATCH` | `/auth/usuarios/:id` | ADMIN | Cambia nombre/rol/activo |
| `GET` | `/empresas` | autenticado | Perfiles de compañía (id, sigla, sector, color, conteos) |
| `GET` | `/empresas/:id` | autenticado | Detalle de una compañía |
| `GET` | `/perspectivas` | autenticado | Lista las 4 perspectivas |
| `GET` | `/kpis` | autenticado | KPIs evaluados (`?periodo=`, `?perspectiva=`, `?empresa=`) |
| `GET` | `/kpis/:id` | autenticado | Detalle de un KPI (`?periodo=`) |
| `GET` | `/kpis/:id/mediciones` | autenticado | Histórico de mediciones |
| `POST` | `/kpis/:id/mediciones` | ADMIN, GERENTE, ANALISTA | Registra medición de un período |
| `PATCH` | `/kpis/:id` | ADMIN, GERENTE, ANALISTA | Actualiza el `real` base |
| `GET` | `/resumen` | autenticado | Índice global (`?periodo=`) |
| `GET` | `/periodos` | autenticado | Lista períodos |
| `GET` | `/periodos/activo` | autenticado | Período activo |
| `POST` | `/periodos` | ADMIN, GERENTE | Crea período |
| `PATCH` | `/periodos/:id/activar` | ADMIN, GERENTE | Activa un período |
| `GET` | `/asignaciones` | ADMIN, GERENTE | Todas las asignaciones |
| `GET` | `/asignaciones/mias` | autenticado | Asignaciones del usuario |
| `POST` | `/asignaciones` | ADMIN, GERENTE | Asigna un objetivo |
| `DELETE` | `/asignaciones/:id` | ADMIN, GERENTE | Quita asignación |
| `GET` | `/reportes` | autenticado | Reporte dinámico (`?perspectiva=&periodo=&usuario=`) |
| `GET` | `/iniciativas?objetivo=&estado=` | autenticado | Lista proyectos/iniciativas de la compañía |
| `GET` | `/iniciativas/:id` | autenticado | Detalle de una iniciativa |
| `POST` | `/iniciativas` | ADMIN, GERENTE | Crea iniciativa (código único + objetivo) |
| `PATCH` | `/iniciativas/:id` | ADMIN, GERENTE, ANALISTA | Actualiza fechas, presupuesto, avance, estado |
| `DELETE` | `/iniciativas/:id` | ADMIN, GERENTE | Elimina iniciativa |
| `GET` | `/alertas?estado=&empresa=` | autenticado | Alertas (RESPONSABLE: solo las suyas) |
| `POST` | `/alertas` | ADMIN, GERENTE | Alerta manual |
| `POST` | `/alertas/generar?periodo=` | ADMIN, GERENTE, ANALISTA | Motor: genera alertas de KPIs críticos del período |
| `PATCH` | `/alertas/:id` | autenticado | Cambia estado (RECONOCIDA/RESUELTA/DESCARTADA) o `leida` |
| `GET` | `/auditoria?entidad=&usuario=&limite=` | ADMIN, GERENTE | Historial de cambios (200 eventos) |
| `POST` | `/importacion/mediciones` | ADMIN, GERENTE, ANALISTA | Importa mediciones masivamente (CSV o `filas`) |
| `GET` | `/reportes/objetivos/exportar` | autenticado | Exporta el reporte de objetivos a CSV |

> **Multi-compañía:** los listados del BSC (`/kpis`, `/resumen`, `/reportes`, `/periodos`, `/objetivos`, `/mapa`, `/indicadores/diccionario`, `/versiones`, `/comparacion`, `/alertas`, `/desviaciones`, `/evidencias`, `/compromisos`, `/calendario`, `/aprobaciones`, `/asignaciones`, `/iniciativas`) aceptan `?empresa=<id>` y filtran por compañía. El frontend envía ese parámetro automáticamente en cada petición según la compañía activa.

Ejemplo de `/resumen` (período Q4):

```json
{
  "indiceGlobal": 84.2,
  "logrado": 11,
  "riesgo": 19,
  "critico": 6,
  "total": 36,
  "porPerspectiva": [ { "id": "financiera", "indiceGlobal": 87.8, "...": "..." } ]
}
```

---



## 4. Funcionalidades de la demo

1. **Login con roles** — autenticación JWT y control de acceso por rol (ADMIN, GERENTE, ANALISTA, RESPONSABLE).
2. **Perfiles de compañía** — conmutador en el panel lateral para cambiar entre **TechPeru SAC**, **Nova Retail SAC** y **Andes Salud**; cada compañía tiene sus propios períodos, objetivos, KPIs, mediciones, alertas y versiones del plan. El cambio reinicia el período, recarga todos los datos y actualiza encabezado, pie y reportes.
3. **Dashboard ejecutivo** — índice global, donut de semáforo (✅/⚠️/❌), radar por perspectiva, tarjetas resumen y gráfico Meta vs Real de los KPIs de la compañía activa.
4. **Vistas de perspectiva** — Financiera, Clientes, Procesos y Aprendizaje, agrupadas por objetivo estratégico.
5. **Trabajo por períodos** — selector de período por compañía (TechPeru: 2025-Q1…Q4; Nova Retail y Andes Salud: 2026-Q1…Q4); los KPIs muestran los valores de ese período y permiten registrar `meta`/`real` con histórico de mediciones.
6. **Simulador de escenarios** ⚡ — desliza el valor `Real` de cualquier KPI y observa cómo se recalcula **en vivo** el índice global (persistido en PostgreSQL).
7. **Reportes dinámicos** — filtra por perspectiva, período y responsable; tabla con semáforo, KPIs críticos resaltados y exportación a **CSV** e **impresión**.
8. **Administración** — gestión de usuarios/roles y **asignación de objetivos (KPIs)** a responsables.

### Módulos adicionales del diagrama funcional

Los módulos 1–3, 5, 7 y 8 se cubren con las funcionalidades 1–8 anteriores. Los cuatro
módulos con especificación formal propia quedan documentados en `docs/`:

| Módulo | En la demo | Especificación |
|--------|------------|----------------|
| **4 · Gestión de iniciativas** | Pestañas **Iniciativas** (proyectos con fechas, responsable, presupuesto y avance), **Tareas** (actividades con resultados/validaciones) y **Calendario** (hitos) | [`docs/modulos-4-6-9-10.md`](docs/modulos-4-6-9-10.md#módulo-4--gestión-de-iniciativas) |
| **6 · Alertas automáticas** | Pestaña **Alertas**: motor por período para KPIs críticos (sin duplicados, severidad) y ciclo de vida NUEVA → RECONOCIDA → RESUELTA/DESCARTADA | [`docs/modulos-4-6-9-10.md`](docs/modulos-4-6-9-10.md#módulo-6--alertas-automáticas) |
| **9 · Auditoría (log de cambios)** | Pestaña **Auditoría** con el historial *quién/cuándo/qué* (16 servicios lo alimentan); lectura para ADMIN/GERENTE | [`docs/modulos-4-6-9-10.md`](docs/modulos-4-6-9-10.md#módulo-9--auditoría-log-de-cambios) |
| **10 · Integraciones** | Pestaña **Importación** (carga masiva de mediciones en CSV), exportación a **CSV** de reportes y API REST con JWT como conector | [`docs/modulos-4-6-9-10.md`](docs/modulos-4-6-9-10.md#módulo-10--integraciones) |

### Usuarios de demostración

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@techperu.pe` | `admin123` | ADMIN |
| `gerente@techperu.pe` | `gerente123` | GERENTE |
| `analista@techperu.pe` | `analista123` | ANALISTA |
| `responsable@techperu.pe` | `responsable123` | RESPONSABLE |

> El seed crea tres compañías (`techperu`, `nova-retail`, `andes-salud`) con sus períodos (TechPeru 2025-Q1…Q4; Nova Retail y Andes Salud 2026-Q1…Q4, Q4 activo), objetivos, KPIs, mediciones base, alertas e iniciativas. El seed de datos fuente vive en `backend/prisma/seed-empresas.mjs`.

---


## 5. Cómo ejecutar el proyecto

### Requisitos

- **Node.js 18+** (probado con Node 22) y npm.
- **PostgreSQL 14+** (para el backend).

### 5.1 Backend (NestJS + Prisma + PostgreSQL)

```bash
cd backend

# 1. Instalar dependencias
npm install

# 2. Configurar la conexión a PostgreSQL en backend/.env
#    (ajusta usuario, contraseña, host y puerto según tu instalación)
cp .env.example .env
#    y edita DATABASE_URL, PORT y JWT_SECRET

# 3. Crear la base de datos (si no existe)
createdb bsc_techperu    # o: psql -c "CREATE DATABASE bsc_techperu;"

# 4. Generar el cliente Prisma, crear las tablas y cargar los 36 KPIs
npm run prisma:generate
npm run prisma:push
npm run prisma:seed

# 5. Levantar el API (http://localhost:3000)
npm run start:dev
```

> El API queda disponible en `http://localhost:3000`. Verifica con
> `curl http://localhost:3000/` (health check) o inicia sesión con
> `curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"admin@techperu.pe","password":"admin123"}'`.

### 5.2 Frontend (React + Vite)

```bash
cd frontend

# 1. Instalar dependencias
npm install

# 2. (Opcional) Apuntar al API. Por defecto usa http://localhost:3000
echo 'VITE_API_URL=http://localhost:3000' > .env

# 3. Levantar el servidor de desarrollo
npm run dev
```

Abre la URL que muestra la consola (por defecto `http://localhost:5173/`).
El encabezado indica si estás **conectado al API** (verde) o usando **datos locales** (ámbar, cuando el API no responde).

### Scripts disponibles

**Frontend**

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Compila para producción en `dist/` |
| `npm run preview` | Previsualiza el build de producción |
| `npm run lint` | Ejecuta oxlint |

**Backend**

| Comando | Descripción |
|---------|-------------|
| `npm run start:dev` | API en modo desarrollo (watch) |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Ejecuta el build de producción |
| `npm run prisma:generate` | Genera el cliente Prisma |
| `npm run prisma:push` | Sincroniza el schema con la base de datos |
| `npm run prisma:seed` | Carga roles, usuarios, perspectivas, 36 KPIs, períodos, asignaciones y mediciones |
| `npm run lint` | Ejecuta oxlint |

### Despliegue (opcional)

El frontend compila a estático (`frontend/dist`) y puede publicarse en GitHub Pages, Vercel o Netlify. El backend (NestJS + Prisma) requiere un hosting con Node y una base PostgreSQL (Render, Railway, Fly.io, etc.).

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

Comprueba la lógica del backend directamente contra el API (requiere el `accessToken` del login):

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@techperu.pe","password":"admin123"}' | jq -r .accessToken)

curl http://localhost:3000/resumen -H "Authorization: Bearer $TOKEN"
# {"indiceGlobal":84.2,"logrado":11,"riesgo":19,"critico":6,"total":36,...}
```

O desde la UI con la pestaña **Simulador** y el botón **Restaurar**. También puedes validar la compilación:

```bash
cd frontend && npm run build && npm run lint
cd ../backend && npm run build && npm run lint
```

---

## 7. Roadmap

- [x] **Fase 1:** demo frontend con datos locales y simulador en vivo.
- [x] **Fase 2:** backend con **NestJS + Prisma + PostgreSQL** que sirve los KPIs y persiste las ediciones del simulador.
- [x] **Fase 3:** autenticación con roles, trabajo por períodos trimestrales, asignación de objetivos y reportes dinámicos.
- [ ] **Fase 4 — Integraciones y gestión de proyectos** (módulos 4 y 10):
  - [x] Importación masiva de mediciones en CSV/JSON con validación por fila (`/importacion/mediciones`).
  - [x] Exportación de reportes a CSV (`/reportes/objetivos/exportar`).
  - [x] CRUD de **iniciativas** ligadas a objetivos con fechas, responsable, presupuesto y avance (módulo 4).
  - [ ] Carga desde **Excel (.xlsx)** con plantilla descargable y modo previa (`dryRun`).
  - [ ] Exportación masiva de catálogos (KPIs, objetivos, alertas, auditoría).
  - [ ] Conectores **ERP/CRM**: OAuth2 saliente, webhooks entrantes firmados y sincronización programada.
  - [ ] Vincular tareas a iniciativas, desglose de recursos/presupuesto y avance calculado.
  - [ ] Guardar múltiples escenarios del simulador y exportación de reportes a **PDF**.
- [ ] **Fase 5 — Alertas automáticas y auditoría detallada** (módulos 6 y 9):
  - [x] Motor de alertas por período para KPIs críticos, con configuración por compañía y control de duplicados (módulo 6).
  - [x] Ciclo de vida de alertas y log de cambios transversal (`/auditoria`) con pestañas en la UI (módulo 9).
  - [ ] Envío de **correos** (SMTP) y avisos **en tiempo real** (SSE/WebSocket).
  - [ ] Alertas por **retraso de iniciativas/tareas** (cron diario).
  - [ ] Auditoría **campo a campo**: `valor anterior → valor nuevo` por campo en los KPIs, con filtros y exportación.

> Detalle ejecutable de las fases 4 y 5 en [`docs/roadmap.md`](docs/roadmap.md).

---

## Documentación adicional (`docs/`)

| Documento | Contenido |
|-----------|-----------|
| [`docs/arquitectura.md`](docs/arquitectura.md) | Sección 3 ampliada: árbol completo de los 24 módulos NestJS, capa de servicios adicionales (`/iniciativas`, `/alertas`, `/auditoria`, `/importacion`) con endpoints y roles, modelos de datos nuevos y cobertura de los 10 módulos del diagrama funcional |
| [`docs/modulos-4-6-9-10.md`](docs/modulos-4-6-9-10.md) | Especificaciones formales de los módulos **4 (iniciativas)**, **6 (alertas automáticas)**, **9 (auditoría)** y **10 (integraciones)**: modelo de datos, reglas de negocio, endpoints, interfaz y pendientes |
| [`docs/roadmap.md`](docs/roadmap.md) | Detalle de la **Fase 4** (integraciones + gestión de proyectos) y la **Fase 5** (canales de alertas + auditoría campo a campo) con el estado de cada entregable |


