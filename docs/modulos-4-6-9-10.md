# Especificaciones formales — Módulos 4, 6, 9 y 10

Especificación de los cuatro módulos del diagrama funcional que faltaba documentar en la
arquitectura. Cada módulo indica **estado actual en la demo**, **modelo de datos**,
**reglas de negocio**, **endpoints y roles**, **interfaz** y **brechas / pendientes**.

- Contexto y árbol de servicios → [`arquitectura.md`](arquitectura.md)
- Fases de ejecución → [`roadmap.md`](roadmap.md)

---

## Módulo 4 · Gestión de iniciativas

**Objetivo.** Proyectos asociados a los objetivos estratégicos, con desglose de actividades,
tareas, hitos, fechas clave, control de recursos y presupuesto.

### Estado actual

✅ **Implementado (base).** CRUD completo de iniciativas con vínculo a objetivos/KPIs,
presupuesto y avance; desglose de actividades mediante el módulo `tareas` (con resultados
validables y evidencias); hitos vía `calendario`. La pestaña **Iniciativas** de la UI permite
crear, filtrar y actualizar proyectos.

### Modelo de datos

| Entidad | Campos | Observaciones |
|---------|--------|---------------|
| `Iniciativa` | `codigo` (único), `nombre`, `descripcion`, `objetivoId` (FK obligatoria), `kpiId?`, `responsableId?`, `fechaInicio`, `fechaFin?`, `presupuesto`, `avance` (0–100), `estado` | Un proyecto siempre cuelga de un **objetivo estratégico**; opcionalmente de un KPI |
| `Tarea` | `titulo`, `descripcion`, `objetivoId`, `kpiId?`, `responsableId`, `creadorId`, `fechaInicio`, `fechaFin`, `estado` (`PENDIENTE`…), `avance` (decimal) | Desglose de actividades |
| `ResultadoTarea` | `descripcion`, `valor?`, `autorId`, `fecha`, `estadoValidacion`, `validadoPorId?`, `aplicadoKpi` | Entregable de una tarea; puede marcar `aplicadoKpi` para impactar el indicador |
| `EventoCalendario` | `titulo`, `tipo`, `fecha`, `periodoId?`, `responsableId?`, `completado`, `descripcion` | Hitos y fechas clave del plan |
| `Evidencia` | archivo + `tareaId`/`kpiId`/`resultadoId`, `subidoPorId` | Soporte documental de la ejecución |

**Estados de iniciativa:** `PLANIFICADA`, `EN_CURSO`, `EN_RIESGO`, `COMPLETADA`, `CANCELADA`.

### Reglas de negocio

1. `codigo` es único en toda la base (proyecto duplicado → `400`).
2. `objetivoId` es obligatorio y debe existir: una iniciativa sin objetivo estratégico no se crea.
3. `responsableId`, de enviarse, debe corresponder a un usuario **activo** (igual criterio que en
   KPIs y tareas).
4. El `avance` se actualiza por edición (`PATCH`) y no se recalcula automáticamente de las
   tareas: en la línea base el responsable de proyecto lo mantiene.
5. Cambiar `estado` a `COMPLETADA`/`CANCELADA` queda registrado en auditoría (`ACTUALIZAR`,
   entidad `Iniciativa`); `DELETE` registra `ELIMINAR`.
6. Filtro multi-compañía: `?empresa=` acota las iniciativas a la compañía activa.

### Endpoints y roles

| Método | Ruta | Roles |
|--------|------|-------|
| `GET` | `/iniciativas?objetivo=&estado=&empresa=` | autenticado |
| `GET` | `/iniciativas/:id` | autenticado |
| `POST` | `/iniciativas` | ADMIN, GERENTE |
| `PATCH` | `/iniciativas/:id` | ADMIN, GERENTE, ANALISTA |
| `DELETE` | `/iniciativas/:id` | ADMIN, GERENTE |

Adyacentes: `GET/POST/PATCH/DELETE /tareas`, `GET /tareas/:id/resultados`,
`POST /tareas/:id/resultados`, `PATCH /tareas/resultados/:id/validar`,
`GET/POST/PATCH /calendario`.

### Interfaz

Pestaña **Iniciativas** (`components/IniciativasPanel.tsx`): alta con formulario (código,
nombre, objetivo, responsable, fechas, presupuesto), tarjetas con estado/avance y acciones
de edición.

### Brechas / pendientes

- **Desglose de actividades por proyecto:** `Tarea` se vincula a `objetivo`/`kpi`, **no** a
  `Iniciativa` (falta `iniciativaId` opcional en `Tarea` para ver actividades dentro del
  proyecto).
- **Recursos y presupuesto detallado:** existe sólo el importe total (`presupuesto`); no hay
  desglose por actividad, costos reales/comprometidos ni moneda configurable.
- **Cálculo de avance:** `avance` manual; se propone derivarlo del avance de sus tareas.
- **Hitos:** `EventoCalendario` es global por período, no por iniciativa.

---

## Módulo 6 · Alertas automáticas

**Objetivo.** Motor de notificaciones por incumplimientos, indicadores en riesgo y retrasos
en iniciativas, con envío de correos o avisos en tiempo real.

### Estado actual

✅ **Motor de detección implementado** (KPIs críticos) + ciclo de vida y UI.
⚠️ **Faltan los canales de envío** (correo y tiempo real): hoy las alertas se consultan en la
UI; no hay proveedor de correo ni stream en vivo.

### Reglas del motor (`AlertasService.generarParaPeriodo(periodoId, usuarioId)`)

1. **Interruptor global:** si `Config.notificarCriticos = false`, no genera nada (`{generadas: 0}`).
2. **Alcance:** todos los KPIs `activo: true` de la **compañía del período**, con su medición
   en ese período.
3. **Evaluación:** usa `CumplimientoService.evaluar()` con las reglas de la compañía
   (`umbralCumplido` = 90, `umbralAlerta` = 75 por defecto; los umbrales propios del KPI
   tienen prioridad).
4. **Umbral de alerta:** sólo se genera si el estado evaluado es **`CRITICO`** y el
   cumplimiento es menor al umbral de alerta (`kpi.umbralAlerta ?? reglas.umbralAlerta`).
5. **Severidad:** `CRITICA` si cumplimiento < 60 %; si no, `ADVERTENCIA`.
6. **Sin duplicados:** se omite si ya existe una alerta `tipo = KPI_CRITICO` para ese KPI en
   estado `NUEVA` o `RECONOCIDA`.
7. **Mensaje:** `[<período>] <KPI>: cumplimiento <x>% por debajo del umbral de alerta (<umbral>%)`.
8. **Registro:** la creación manual de alertas queda en auditoría (`CREAR`, entidad `Alerta`).

### Ciclo de vida

`NUEVA` → `RECONOCIDA` → `RESUELTA` o `DESCARTADA` (al resolver/descartar se marca
`resueltaEn`). Campo `leida` independiente del estado. El `destinatarioId` define a quién
está dirigida; un usuario con rol `RESPONSABLE` **sólo ve sus alertas** (filtrado en servidor).

### Endpoints y roles

| Método | Ruta | Roles |
|--------|------|-------|
| `GET` | `/alertas?estado=&destinatario=&empresa=` | autenticado (RESPONSABLE: sólo las suyas) |
| `POST` | `/alertas` | ADMIN, GERENTE |
| `POST` | `/alertas/generar?periodo=<id>` | ADMIN, GERENTE, ANALISTA |
| `PATCH` | `/alertas/:id` | autenticado |

### Interfaz

Pestaña **Alertas** (`components/AlertasPanel.tsx`): selector de período + botón **Generar
alertas**, listado con color por severidad y acciones **Reconocer/Resolver**; el icono del
encabezado navega a la pestaña.

### Especificación pendiente (canales)

| Canal | Especificación |
|-------|----------------|
| **Correo** | Proveedor SMTP (p. ej. `nodemailer`) + configuración `Config.emailAlertas`/plantilla HTML; envío al `destinatario` (o a los responsables del KPI) al generar; reintentos con cola simple y registro de envío en `Auditoria` |
| **Tiempo real** | SSE o WebSocket `/alertas/stream` para que el índice de campana se actualice sin recargar; alternativa mínima: `GET /alertas?noLeidas=true` con polling |
| **Retrasos en iniciativas** | Nueva ejecución programada (cron diario) que compara `fechaFin` de `Iniciativa`/`Tarea` con hoy y genera `tipo = INICIATIVA_RETRASADA` |
| **Reglas adicionales** | Umbrales por tipo de alerta y severidad heredados de `Config`; digest diario/resumen semanal |

---

## Módulo 9 · Auditoría (log de cambios)

**Objetivo.** Historial detallado de modificaciones en los KPIs (y en general de la
aplicación), indicando **quién, cuándo y qué campo cambió (valor anterior vs. valor nuevo)**.

### Estado actual

✅ **Registro transversal implementado** en **16 servicios** (44 puntos de registro) y
pestaña **Auditoría** para lectura.
⚠️ El `detalle` guarda los datos enviados del último cambio, pero **no calcula el par
anterior/nuevo por campo**, y la UI no muestra ese detalle.

### Modelo de datos

| Campo | Contenido |
|-------|-----------|
| `usuarioId` | **Quién** — usuario autenticado (`null` en eventos de sistema) |
| `accion` | Qué operación: `CREAR`, `ACTUALIZAR`, `DESACTIVAR`, `ELIMINAR`, `IMPORTAR`, `PUBLICAR`, `APROBAR`, `RECHAZAR`, `SOLICITAR_APROBACION`, `ARCHIVAR` |
| `entidad` | Sobre qué objeto: `Kpi`, `Objetivo`, `Medicion`, `Iniciativa`, `Tarea`, `ResultadoTarea`, `Alerta`, `Desviacion`, `Recomendacion`, `Compromiso`, `Evidencia`, `Config`, `Perspectiva`, `PlanVersion`, `EventoCalendario`, `RelacionCausal` (16 entidades) |
| `entidadId` | Identificador del registro afectado |
| `detalle` | JSON con el contexto del cambio (p. ej. `{ equipo: [...] }`, `{ importadas, errores }`, o el DTO completo en `Kpi`) |
| `createdAt` | **Cuándo** — fecha/hora del evento (índice implícito por orden descendente) |

### Endpoints y roles

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/auditoria?entidad=&usuario=&limite=` | ADMIN, GERENTE | Historial (200 eventos por defecto) con `usuario: {id, nombre, email}` |

### Interfaz

Pestaña **Auditoría** (`components/AuditoriaPanel.tsx`): tabla con Fecha, Usuario, Acción,
Entidad y Entidad ID; restringida a ADMIN/GERENTE. El tipo `Auditoria` ya expone `detalle`,
aún no renderizado.

### Especificación pendiente (detalle campo a campo)

Entrada recomendada del servicio:

```ts
registrar({
  usuarioId,
  accion: 'ACTUALIZAR',
  entidad: 'Kpi',
  entidadId: id,
  detalle: {
    campos: [
      { campo: 'meta',   anterior: 95, nuevo: 100 },
      { campo: 'real',   anterior: 88, nuevo: 91.5 },
      { campo: 'umbralAlerta', anterior: 75, nuevo: 80 },
    ],
  },
});
```

- En `IndicadoresService.actualizar()` leer el registro **antes** del `update` y calcular el
  diff sólo de los campos modificados (los que difieren entre el registro previo y el DTO).
- UI: desplegable por fila para mostrar `campo | anterior → nuevo`, con filtros por entidad
  y rango de fechas.
- Exportación CSV del historial y retención configurable (p. ej. conservar 24 meses).
- Agregar `empresaId` a `Auditoria` para filtrar el log por compañía (hoy el log es global).

---

## Módulo 10 · Integraciones

**Objetivo.** Conectores mediante APIs, carga/exportación masiva desde Excel y sincronización
con sistemas ERP y CRM.

### Estado actual

⚙️ **Parcial.**

| Capacidad | Estado |
|-----------|--------|
| API REST + JWT (conector genérico) | ✅ 68+ endpoints documentados en `README.md` §3, con `?empresa=` multi-compañía |
| Importación masiva de mediciones (CSV o `filas` JSON) | ✅ `POST /importacion/mediciones` con validación por fila y reporte de errores |
| Exportación CSV de reportes | ✅ `GET /reportes/objetivos/exportar` (Content-Disposition) |
| Carga desde **Excel (.xlsx)** | ⬜ Pendiente |
| Exportación masiva de catálogos (KPIs, objetivos, alertas, auditoría) | ⬜ Pendiente |
| Sincronización ERP/CRM | ⬜ Pendiente |

### Endpoints y roles

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `POST` | `/importacion/mediciones` | ADMIN, GERENTE, ANALISTA | Body `{ periodoId, csv? , filas? }` → `{ periodo, totalFilas, importadas, errores[] }` |
| `GET` | `/reportes/objetivos/exportar?empresa=` | autenticado | CSV con los indicadores de los objetivos |

**Reglas de importación (RN-12):** encabezado obligatorio `kpiId,meta,real[,nota]`; el KPI
debe existir y pertenecer a la misma compañía que el período; cada fila inválida se acumula
en `errores[]` sin abortar el lote; el éxito registra `IMPORTAR` en auditoría sobre
`Medicion` (upsert por `kpiId_periodoId`).

### Especificación pendiente

**1. Carga desde Excel (.xlsx)**

- Plantilla descargable (`GET /importacion/plantilla`) con las hojas `Mediciones`,
  `Objetivos` e `Indicadores` y una fila de ejemplo por hoja.
- `POST /importacion/excel` (multipart) → misma respuesta por fila que el CSV, más
  mapeo de columnas por nombre de encabezado (tolerante a mayúsculas/acentos).
- **Modo previa (`dryRun`)**: valida sin escribir y devuelve el resumen de cambios.
- Progreso por lotes para archivos grandes (> 5 000 filas).

**2. Exportación masiva**

- `GET /export/kpis?empresa=` (XLSX/CSV), `GET /export/objetivos`, `GET /export/alertas`
  y `GET /export/auditoria?desde=&hasta=`.
- Mismo criterio de compañía que los reportes; cabecera `Content-Disposition`.

**3. Sincronización ERP/CRM**

- **Conectores salientes:** OAuth2 + endpoint propio de cada sistema; mapeo de IDs
  (`erpCode` en `Kpi`/`Objetivo`), sincronización programada (cron configurable) de
  mediciones y objetivos, con reintentos idempotentes por `empresaId + entidad + periodo`.
- **Entrante:** webhook `POST /webhooks/:sistema` con firma HMAC, encolado y reintentos.
- **Catálogo de conectores** en `Config` (habilitado/deshabilitado, credenciales cifradas,
  última sincronización) y eventos de fallo visibles en alertas/auditoría.
