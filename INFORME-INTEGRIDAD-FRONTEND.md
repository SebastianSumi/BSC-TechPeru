# Informe de integridad del frontend (y su acoplamiento con el backend)

> **Fecha:** 27-10-2026 · **Rama:** `main` (head `6a29031`) · **Alcance:** solo diagnóstico y documentación.
> **No se modificó código en la elaboración de este informe.**
>
> **Método:** lectura estática de todo el código (37 archivos de `frontend/src`, 21 controladores del backend),
> conteo de rutas HTTP por decorador, mapeo `método de lib/api.ts → ruta backend → llamador en la UI`,
> más **verificación en vivo** contra el backend en `localhost:3000` (peticiones `GET` con token de los 4 roles).

---

## 1. Inventario de código

| Grupo | Archivos | LOC |
|---|---:|---:|
| Componentes (`frontend/src/components/*.tsx`) | 26 | 2.737 |
| Shell de la app (`App.tsx` 924, `main.tsx` 10) | 2 | 934 |
| Stores/hooks (`useBsc.ts`, `useAuth.tsx`, `useEmpresa.ts`) | 3 | 196 |
| **Total React** (componentes + shell + stores) | **31** | **3.867** |
| TS sin React (`lib/api.ts` 351, `lib/bsc.ts` 53, `data/kpis.ts` 54, `data/types.ts` 316) | 4 | 774 |
| Estilos (`src/index.css`) | 1 | 1.037 |
| HTML nativo (`frontend/index.html`) | 1 | 23 |
| **Total `frontend/src`** | **37** | **≈5.679** |

Componentes con su volumen: `App.tsx` 924 · `AdminPanel.tsx` 279 · `Reportes.tsx` 253 · `MapaEstrategico.tsx` 173 · `Login.tsx` 163 · `PeriodoSelector.tsx` 132 · `ComparacionPanel.tsx` 121 · `ObjetivosPanel.tsx` 121 · `IniciativasPanel.tsx` 119 · `AlertasPanel.tsx` 109 · `DesviacionesPanel.tsx` 111 · `DiccionarioPanel.tsx` 105 · `KpiModal.tsx` 104 · `SimuladorPanel.tsx` 105 · `EvidenciasPanel.tsx` 97 · `VersionesPanel.tsx` 97 · `CompromisosPanel.tsx` 88 · `ConfigPanel.tsx` 87 · `AprobacionesPanel.tsx` 84 · `ImportPanel.tsx` 81 · `KpiCard.tsx` 66 · `CalendarioPanel.tsx` 54 · `AuditoriaPanel.tsx` 48 · `MetaRealChart.tsx` 45 · `SemaforoDonut.tsx` 40 · `EstadoBadge.tsx` 28 · `RadarPerspectivas.tsx` 27 · `main.tsx` 10.

**Estado de build/calidad (verificado hoy):**

- `npx tsc -b` → sin errores.
- `npm run build` → OK en 11,77 s; salida `dist/index-*.js` **747.433 B** y `dist/index-*.css` **37.043 B** (aviso rolldown: chunk > 500 kB, sin code-splitting).
- `npx oxlint src` → **4 warnings, 0 errores**, todos preexistentes y ajenos a la capa multi-compañía:
  `useAuth.tsx:63` (`only-export-components`), `useAuth.tsx:29`, `Reportes.tsx:28`, `Reportes.tsx:32` (`set-state-in-effect`).
- **No existen tests**: `frontend/package.json` no define script `test`; no hay archivos `*.test.*` ni `*.spec.*`.
- Backend: `npm run build` y `npx oxlint src` OK (2 warnings preexistentes: `auth.service.ts:6`, `alertas.service.ts:86`).

---

## 2. Qué es React y qué no lo es

### 2.1 Es React (dentro del modelo de componentes)

- **Componentes de interfaz**: los 26 de `src/components` + `App.tsx` (estado, efectos, render declarativo).
- **Hooks de estado/datos**: `store/useAuth.tsx` (sesión, `puede()` de roles), `store/useBsc.ts` (KPIs, resumen, fuente de datos), `store/useEmpresa.ts` (catálogo de compañías y compañía activa).
- **Punto de montaje**: `main.tsx` → `createRoot(document.getElementById('root')!)`.

### 2.2 No es React

| Capa | Archivo(s) | Qué es |
|---|---|---|
| Cliente HTTP | `lib/api.ts` (351 LOC) | Objeto plano `api` con **74 métodos**; TS puro, cero JSX, cero hooks. |
| Lógica de negocio | `lib/bsc.ts` (53 LOC) | Funciones puras de cumplimiento/estado. |
| Tipos de dominio | `data/types.ts` (316 LOC) | Interfaces de DTO (Kpi, Objetivo, Periodo, Empresa…). |
| **Catálogo hardcodeado** | `data/kpis.ts` (54 LOC) | 4 perspectivas + 36 KPIs de demostración, incluidos sus colores. |
| Estilos | `index.css` (1.037 LOC) | CSS plano: `@import "tailwindcss"`, 89 selectores propios `.bsc-*`, 3 bloques `@media`, **0 `@apply`**. |
| HTML nativo | `frontend/index.html` (23 LOC) | Shell fuera de React: `<div id="root">`, fuentes Google, título y meta description. |
| JS imperativo aislado | en `api.ts`/`App.tsx` | `localStorage` (token + `bsc_empresa`), `window.scrollTo`, `document.createElement('a')` para exportar CSV. |
| Config/build | `vite.config.ts`, `tsconfig*.json`, `package.json`, `.oxlintrc.json`, `.env` | Fuera del árbol de ejecución. |
| Artefactos | `dist/` (ignorado por git), `public/` (vacío), `src/assets/vite.svg` (sin importar) | No participan. |

**Mecanismo de render de charts:** Recharts (librería externa) dentro de componentes React (`RadarPerspectivas`, `MetaRealChart`, `SemaforoDonut`) — React controla el contenedor, no los `<path>` SVG.
**Estilos en JSX:** 557 atributos `className=` (Tailwind utilitario) y 143 bloques `style={{}}` en línea; el CSS propio (89 selectores `.bsc-*`) y Tailwind conviven sin `@apply`.

---

## 3. Qué se conecta al backend

### 3.1 Cadena de datos

```
main.tsx → App.tsx (AuthProvider → useAuth, useEmpresa, useBsc(periodoId, empresaId))
             → paneles → lib/api.ts → request() → fetch({API}/ruta?empresa=<id>) → NestJS 3000 → Prisma → Postgres
```

- `lib/api.ts:56` `request<T>()`: añade `Authorization`, autodetecta `API` (`VITE_API_URL` o `host:3000`) y
  **append automático `?empresa=<id>`** en todas las rutas salvo `/empresas*` y `/auth*` (clave `localStorage.bsc_empresa`, defecto `techperu`).
- Fuente de datos (`store/useBsc.ts:36,56`): `'api'` si `/resumen` responde; si cae, **fallback `'local'`** al catálogo `data/kpis.ts` (solo TechPeru); si tampoco existe, `'sin-datos'`.

### 3.2 Cobertura de rutas (recuento exacto)

| Métrica | Valor |
|---|---:|
| Endpoints HTTP definidos en el backend (21 controladores) | **80** |
| Rutas distintas que expone `lib/api.ts` | 68 + 6 sin extraer* |
| **Rutas backend consumidas por la UI** | **68** |
| **Rutas backend SIN ninguna cobertura en `lib/api.ts`** | **10** |
| Métodos exportados por `lib/api.ts` | **74** |
| Métodos efectivamente llamados desde la UI | **43** |
| **Métodos que nadie llama** | **31** |

\* `upsertMedicion`, `solicitarAprobacion`, `aprobarMedicion`, `rechazarMedicion`, `historialAprobacion`, `actualizarPonderacionPerspectiva` construyen la ruta de forma no parseable; de ellos solo `aprobarMedicion` y `rechazarMedicion` tienen UI.

### 3.3 Componentes conectados (22) → endpoints

| Componente/hook | Métodos `api.*` | Rutas |
|---|---:|---|
| `store/useBsc.ts` | 3 | `GET /kpis`, `GET /resumen`, `PATCH /kpis/:id` |
| `store/useAuth.tsx` | 2 | `POST /auth/login`, `GET /auth/me` |
| `store/useEmpresa.ts` | 1 | `GET /empresas` |
| `App.tsx` | 1 | `GET /periodos` |
| `PeriodoSelector.tsx` | 2 | `GET /periodos`, `PATCH /periodos/:id/activar` |
| `ObjetivosPanel.tsx` | 2 | `GET/POST /objetivos` |
| `DiccionarioPanel.tsx` | 1 | `GET /indicadores/diccionario` |
| `MapaEstrategico.tsx` | 1 | `GET /mapa` |
| `ComparacionPanel.tsx` | 1 | `GET /comparacion` |
| `Reportes.tsx` | 3 | `GET /reportes`, `GET /periodos`, `GET /auth/usuarios` |
| `AlertasPanel.tsx` | 3 | `GET /alertas`, `POST /alertas/generar`, `PATCH /alertas/:id` |
| `AuditoriaPanel.tsx` | 1 | `GET /auditoria` |
| `AprobacionesPanel.tsx` | 3 | `GET /aprobaciones/pendientes`, `POST .../aprobar`, `POST .../rechazar` |
| `CalendarioPanel.tsx` | 1 | `GET /calendario` |
| `CompromisosPanel.tsx` | 2 | `GET/POST /compromisos` |
| `DesviacionesPanel.tsx` | 3 | `GET/POST /desviaciones`, `GET /kpis` |
| `EvidenciasPanel.tsx` | 3 | `GET/POST /evidencias`, `GET /kpis` |
| `IniciativasPanel.tsx` | 3 | `GET/POST /iniciativas`, `GET /objetivos` |
| `VersionesPanel.tsx` | 3 | `GET/POST /versiones`, `PATCH /versiones/:id/publicar` |
| `ConfigPanel.tsx` | 2 | `GET/PATCH /config` |
| `ImportPanel.tsx` | 1 | `POST /importacion/mediciones` |
| `AdminPanel.tsx` | 7 | `GET/POST/PATCH /auth/usuarios`, `GET/POST/DELETE /asignaciones`, `GET /kpis` |

**Componentes sin conexión directa** (reciben todo por props o son puramente visuales): `EstadoBadge` y su `CumplimientoBar` (ambos en `EstadoBadge.tsx`), `KpiCard`, `KpiModal`, `SemaforoDonut`, `RadarPerspectivas`, `MetaRealChart`, `Login` (actúa vía `useAuth`), `SimuladorPanel` (escribe vía `setReal` de `useBsc`, que sí persiste), y los helpers embebidos en `App.tsx` (`PageHeader`, `Panel`, `MetricCard`, `Conteo`, `Dashboard`, `PerspectivaView`).

---

## 4. Qué no tiene interfaz (huecos de UI)

### 4.1 Las 10 rutas backend sin exposición en `lib/api.ts`

| Ruta | Motivo |
|---|---|
| `GET /` | health check, sin consumidor. |
| `GET /perspectivas` | **ni siquiera existe método**: la UI usa `PERSPECTIVAS` de `data/kpis.ts`. |
| `GET /kpis/:id` | no hay método de detalle de KPI. |
| `GET /iniciativas/:id` | no hay método de detalle. |
| `GET /indicadores/:id` | no hay método de detalle. |
| `PATCH /periodos/:id` | **no existe**: la UI solo puede crear, activar y eliminar períodos, nunca editarlos. |
| `POST /kpis/:id/mediciones` | método `upsertMedicion()` existe, **nunca se llama**. |
| `POST /aprobaciones/:medicionId/solicitar` | método `solicitarAprobacion()` existe, nunca se llama. |
| `GET /aprobaciones/historial/:medicionId` | método `historialAprobacion()` existe, nunca se llama. |
| `PATCH /config/perspectivas/:id/ponderacion` | método `actualizarPonderacionPerspectiva()` existe, nunca se llama. |

### 4.2 Los 31 métodos de `lib/api.ts` que nadie invoca

- **Detalle/lectura sin UI:** `obtenerObjetivo`, `obtenerEmpresa`, `obtenerVersion`, `periodoActivo`, `mediciones`, `misAsignaciones`, `listarRoles`.
- **Edición sin UI:** `actualizarObjetivo`, `actualizarIndicador`, `actualizarIniciativa`, `actualizarDesviacion`, `actualizarCompromiso`, `actualizarEvento`, `archivarVersion`.
- **Baja/eliminación sin UI:** `desactivarObjetivo`, `desactivarIndicador`, `eliminarPeriodo`, `eliminarEvidencia`, `eliminarCompromiso`, `eliminarDesviacion`, `eliminarEvento`, `eliminarIniciativa`, `eliminarRelacion`.
- **Alta sin UI:** `crearAlerta`, `crearIndicador`, `crearEvento`, `crearRelacion`.
- **Aprobaciones/config sin UI:** `upsertMedicion`, `solicitarAprobacion`, `historialAprobacion`, `actualizarPonderacionPerspectiva`.

**Consecuencia práctica:** el usuario puede *crear* pero no *editar ni eliminar* objetivos/indicadores/iniciativas desde la UI; puede *crear/activar/borrar* un período pero no renombrarlo ni cambiar sus fechas; y el flujo completo de mediciones con aprobación (sección 5.1) carece de extremo de entrada.

---

## 5. Partes del backend que no funcionan con la UI o que no se usan

### 5.1 El flujo de mediciones y aprobaciones está vacío en origen

- El backend define `POST /kpis/:id/mediciones` (`bsc.controller.ts:47`, roles ADMIN/GERENTE/ANALISTA), `GET /kpis/:id/mediciones`, `POST /aprobaciones/:id/solicitar` (`:33`), `GET /aprobaciones/historial/:id` (`:28`) y `GET /aprobaciones/pendientes` (`aprobaciones.controller.ts:22`).
- **La UI nunca crea una `Medición`**: el simulador persiste con `PATCH /kpis/:id` (`store/useBsc.ts:66`), que sobrescribe el campo `real` del KPI.
- **Verificado en vivo:** `GET /aprobaciones/pendientes` con token admin → **`[]`**. El panel "Aprobaciones" de la UI está **permanentemente vacío**, y el historial de aprobaciones no tiene datos que mostrar.
- Los flags `Config.requiereAprobacion` y `Config.requiereEvidencia` **no se evalúan en ninguna parte del backend** (aparecen solo en `config.service.ts:11-12` y el DTO).

### 5.2 `PATCH /kpis/:id` no audita ni conserva histórico

- `bsc.service.ts:139-146` hace `prisma.kpi.update({ real })` **sin** `auditoria.registrar` y **sin** crear `Medicion`.
- **Verificado:** no existe ninguna llamada a `auditoria.registrar` en `bsc.service.ts` ni en `auth/` ni en `periodos/`.
- Efectos en la UI:
  - Los cambios del simulador **no aparecen en Auditoría**.
  - El botón "Restablecer" (`store/useBsc.ts:71` → `reset = cargar()`) **recarga desde la API** y devuelve el valor ya sobrescrito: **no deshace nada**.
  - El banner "Escenario simulado activo: los valores no corresponden a las mediciones guardadas" es **engañoso**: sí se guardaron.

### 5.3 Configuración global única, compartida por las tres compañías

- `Config` (`schema.prisma:399`) es una fila única `id = 'global'` **sin `empresaId`** (`config.service.ts:24,31`).
- `ConfigPanel` solo pinta 4 campos: `empresa` (texto libre, sin relación con la tabla `Empresa`), `umbralCumplido`, `umbralAlerta`, `notificarCriticos`.
- `anioBase`, `requiereAprobacion` y `requiereEvidencia` **ni se muestran ni se aplican**.

### 5.4 Los umbrales de configuración no gobiernan el dashboard

- `bsc.logic.ts:13-17` (`clasificarEstado`) usa **90 / 75 fijos**; `calcularIndice` (`bsc.logic.ts:30`) es una media simple.
- Por tanto `/resumen`, `/kpis` y `/reportes` **ignoran** `Config.umbralCumplido/umbralAlerta`; solo `/indicadores/diccionario` (`indicadores.service.ts:69-70`) los usa como *fallback*.
- **Resultado:** cambiar umbrales en Configuración cambia el texto del diccionario, pero **no cambia ningún semáforo del dashboard ni el índice global**.

### 5.5 Poderes de ponderación muertos

- La BD guarda `Perspectiva.ponderacion` (30/30/20/20, verificado por `GET /perspectivas`), `Objetivo.ponderacion` y `Kpi.ponderacion`.
- `calcularIndice` hace **promedio simple**: las ponderaciones **no afectan ningún cálculo**.
- `PATCH /config/perspectivas/:id/ponderacion` existe (`config.controller.ts:35`) pero no tiene UI **y nadie lo lee** → doblemente inerte.

### 5.6 Tres fuentes de perspectivas con colores incompatibles

| Fuente | Financiera | Clientes | Procesos | Aprendizaje |
|---|---|---|---|---|
| BD vía `GET /perspectivas` (verificado hoy) | `#10b981` | `#3b82f6` | `#f59e0b` | `#8b5cf6` |
| `data/kpis.ts:4-7` (usado por App, Objetivos, Diccionario, Reportes, Simulador, Radar) | `#16845b` | `#2563eb` | `#b97708` | `#7354c8` |
| `MapaEstrategico.tsx:5-10` (mapa estratégico) | `#16845b` | `#2563eb` | `#b97708` | `#7354c8` |

`GET /perspectivas` **no tiene ningún consumidor**, y en cambio `ComparacionPanel.tsx:66` sí pinta con los colores que trae `/comparacion` (BD) → **la pestaña Comparación usa una paleta distinta al resto de la aplicación**.

### 5.7 Auditoría sin compañía y con eventos faltantes

- `Auditoria` (`schema.prisma:388`) **no tiene `empresaId`** → el panel "Auditoría" **mezcla acciones de las tres compañías** (verificado: los registros devueltos no distinguen compañía).
- 31 puntos de registro (`auditoria.registrar`) en config, objetivos, indicadores, iniciativas, alertas, desviaciones, evidencias, compromisos, calendario, versiones, mapa, importación y aprobaciones; **no registran**: login, alta/baja de usuarios, creación/activación/eliminación de períodos, mediciones y los cambios del simulador.

### 5.8 Usuarios y roles globales

- `Usuario` no tiene `empresaId`: `GET /auth/usuarios` devuelve los usuarios de las tres compañías y `AdminPanel` no los distingue (funciona, pero no es un control de acceso por compañía).
- `GET /auth/roles` existe y **no tiene UI**: `AdminPanel.tsx:7` declara `const ROLES: RolNombre[] = [...]` hardcodeado (deriva potencial de desfase si cambian los roles del backend).

### 5.9 Otras rutas con backend pero sin uso significativo

- `GET /periodos/activo` (método existe, la UI lo infiere del listado).
- `GET /asignaciones/mias` (método existe; en su lugar `/reportes` aplica el recorte por `user.id` en servidor, `bsc.controller.ts:67-79`).
- `POST /alertas` (alta manual de alerta sin UI; solo existe "Generar" → `POST /alertas/generar`).
- `GET /versiones/:id` y `GET /objetivos/:id` (métodos existen, nunca se usan: la UI no muestra detalle individual).
- **Sí tiene UI y funciona:** `POST /importacion/mediciones` ← `ImportPanel.tsx:18`, renderizado en `App.tsx`.

---

## 6. Inconsistencias de rol y errores silenciados

### 6.1 Menú abierto a todos, backend restrictivo (verificado por curl hoy)

De las **23 pestañas** declaradas en `TABS`, solo `admin` declara `roles` (`App.tsx:251-256`, tipo en `App.tsx:92`); `App.tsx:321` filtra con `!t.roles || puede(...)`, así que **ANALISTA y RESPONSABLE ven 22 pestañas**, incluidas Reportes, Aprobaciones, Auditoría y Simulador.

| Rol | Pestaña visible | Petición | Respuesta |
|---|---|---|---|
| ANALISTA | Reportes | `GET /auth/usuarios` (`auth.controller.ts:39`) | **403** → filtro de usuario en blanco **en silencio** |
| ANALISTA | Aprobaciones | `GET /aprobaciones/pendientes` (`aprobaciones.controller.ts:22`) | **403** → panel vacío |
| ANALISTA | Auditoría | `GET /auditoria` (`auditoria.controller.ts:13`) | **403** → panel vacío |
| RESPONSABLE | Auditoría | `GET /auditoria` | **403** |
| RESPONSABLE | Simulador | `PATCH /kpis/:id` (`bsc.controller.ts:61`) | **403** → el cambio **se ve en pantalla pero no se guarda**, y `useBsc.ts:66` lo traga con `.catch(() => {})` |
| Cualquiera | — | `GET /empresas` | 200 (verificado) |

### 6.2 Manejo de errores

- **23** promesas terminadas en `.catch(() => {})` repartidas por componentes y stores: solo `Login.tsx` y `AdminPanel.tsx` muestran un error al usuario.
- **0** bloques `catch` vacíos, pero la práctica es equivalente: cualquier fallo de red/permiso se traduce en listas vacías sin aviso.
- El fallback a datos locales (`useBsc.ts:56`) puede ocultar un backend caído detrás de un dashboard con aspecto normal (marca "sin conexión" solo si tampoco hay datos locales).

### 6.3 Otras carencias estructurales

- **Sin enrutador**: no hay `react-router`; la pestaña y la compañía viven solo en memoria → recargar la página vuelve a Dashboard/TechPeru; el token JWT queda en `localStorage`.
- **`vite dev` sin `--host`**: inaccesible desde otros equipos/móvil salvo túnel; `vite preview` sí sirve en `localhost:4173`.
- **`frontend/index.html` desactualizado**: `<title>` y `meta description` siguen diciendo "BSC TechPeru SAC 2025" mientras la app es multi-compañía; hay favicon inexistente (`public/` vacío) y una petición externa a Google Fonts.

---

## 7. Verificado que funciona

- Login `POST /auth/login` → 201 con los 4 usuarios demo; `GET /auth/me` correcto en los 4.
- Aislamiento por compañía: `GET /kpis` con `?empresa=techperu` 36, `?empresa=nova-retail` 16, `?empresa=andes-salud` 16 (sin parámetro → 68); períodos, objetivos y resúmenes separados.
- `GET /resumen` → TechPeru 84,2 % vs Nova Retail 87,2 % (índices distintos por compañía).
- `GET /comparacion` cruzando períodos de compañías distintas → **400** con mensaje claro.
- `GET /empresas` → 3 compañías con `_count`; el conmutador de la sidebar los lista y persiste la selección.
- `POST` de período/objetivo aislado por compañía y limpieza posterior de las pruebas.
- Endpoints de solo-lectura respetan `@Roles` (tabla 6.1).
- Build de producción y lint en verde (sección 1).

---

## 8. Prioridades propuestas (no implementadas en este informe)

| | Hallazgo | Impacto |
|---|---|---|
| **P0** | §5.1-5.2: el simulador sobrescribe `real` sin `Medicion` ni auditoría y el botón "Restablecer" no deshace | Pérdida irreversible de valores sembrados; panel Aprobaciones inútil |
| **P0** | §6.1: pestañas visibles para roles que reciben 403 y §6.2: 23 `.catch` mudos | Experiencia rota y silenciosa (listas vacías, cambios no guardados) |
| **P1** | §5.3-5.4: config global y umbrales que no gobiernan el cálculo | Configuración aparente pero inefectiva; compartida entre compañías |
| **P1** | §4: 31 métodos sin UI y 10 rutas sin exposición (editar/eliminar objetivos, editar período, detalle individual) | CRUD incompleto |
| **P2** | §5.6-5.7: paletas duplicadas y auditoría sin compañía ni eventos clave | Inconsistencia visual y de trazabilidad |
| **P2** | §5.5: ponderaciones inertes | Cálculo del índice menosprecado respecto de lo modelado |
| **P3** | §6.3: enrutado, `index.html` desactualizado, code-splitting, tests, `--host` en dev | Mantenibilidad y distribución |

---

## Anexo: comandos de verificación usados

```bash
# cobertura de rutas
grep -rho "@\(Get\|Post\|Patch\|Put\|Delete\)" backend/src --include=*.controller.ts | wc -l   # 80
# conteo y mapeo por script: api.ts → ruta backend → llamador en frontend/src
grep -rn "\.catch(\s*() => {})" frontend/src | wc -l                                            # 23

# servidor: backend en :3000 (node dist/main), Postgres en /tmp
TOK=$(curl -s -X POST localhost:3000/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@techperu.pe","password":"admin123"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["accessToken"])')
curl -s "localhost:3000/aprobaciones/pendientes" -H "Authorization: Bearer $TOK"   # []
curl -s "localhost:3000/perspectivas"          -H "Authorization: Bearer $TOK"   # colores BD
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/auditoria -H "Authorization: Bearer $TOK"  # 403 con analista
```
