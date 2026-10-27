# Arquitectura — capa de servicios del backend

Documento complementario de la **Sección 3** del `README.md`. Describe el árbol completo de
módulos NestJS, los servicios adicionales incorporados (`/iniciativas`, `/alertas`,
`/auditoria`, `/importacion`) y la cobertura de los 10 módulos del diagrama funcional.

- Especificaciones formales de los módulos 4, 6, 9 y 10 → [`modulos-4-6-9-10.md`](modulos-4-6-9-10.md)
- Fases y pendientes → [`roadmap.md`](roadmap.md)

---

## 1. Árbol de módulos backend (`backend/src`)

```
backend/src/
├── main.ts                  # Bootstrap + CORS + ValidationPipe global
├── app.module.ts            # Módulo raíz (registra todos los módulos de dominio)
│
├── prisma/                  # PrismaService global (conexión PostgreSQL)
├── comun/                   # Acceso: AccesoService (reglas de visibilidad por rol/compañía)
│
├── auth/                    # JWT, guards globales (JwtAuthGuard, RolesGuard, @Public), @Roles,
│                            #   usuarios y catálogo de roles
├── empresas/                # Perfiles de compañía (TechPeru, Nova Retail, Andes Salud)
├── periodos/                # CRUD de períodos trimestrales + activación
├── config/                  # Configuración global por compañía (umbrales, formato, agregación,
│                            #   bandera notificarCriticos) + auditoría de cambios
│
├── bsc/                     # Lógica BSC: cumplimiento, semáforo, resumen e índices
├── cumplimiento/            # CumplimientoService.reglas() + evaluar() (umbrales por compañía)
│
├── catalogos/               # Catálogos del modelo (perspectivas, objetivos base)
├── objetivos/               # Objetivos estratégicos (CRUD, auditoría, responsables)
├── indicadores/             # Diccionario de indicadores (KPI CRUD, equipo, mediciones, umbrales)
│
│   ── Módulo 4 (Gestión de iniciativas) ──
├── iniciativas/             # CRUD de proyectos/iniciativas vinculadas a objetivos y KPIs
├── tareas/                  # Actividades de bajo nivel: tareas + resultados/validaciones
├── calendario/              # Hitos y eventos por período (cierres, entregas)
│
│   ── Módulo 6 (Alertas automáticas) ──
├── alertas/                 # Motor de generación de alertas por incumplimiento + lectura/ciclo de vida
│
│   ── Módulo 9 (Auditoría) ──
├── auditoria/               # Servicio de registro (quién/cuándo/qué) + endpoint de lectura
│
│   ── Módulo 10 (Integraciones) ──
├── importacion/             # Carga masiva de mediciones (CSV o filas JSON)
├── reportes/                # Reportes por objetivo + exportación CSV
│
├── evidencias/              # Evidencias con almacenamiento de archivos (subida/listado)
├── desviaciones/            # Análisis de desviaciones + medidas correctivas
├── recomendaciones/         # Recomendaciones y fijado de recomendación destacada
├── compromisos/             # Compromisos de reuniones
├── aprobaciones/            # Flujo de aprobación de versiones del plan
├── versiones/               # Versiones/snapshots del plan estratégico
├── mapa/                    # Mapa estratégico + relaciones causales
├── comparacion/             # Comparación entre períodos y compañías
└── asignaciones/            # Asignación de objetivos/KPIs a usuarios
```

**24 controladores registrados:** `auth`, `empresas`, `periodos`, `config`, `bsc`,
`catalogos`, `objetivos`, `indicadores`, `iniciativas`, `tareas`, `calendario`, `alertas`,
`auditoria`, `importacion`, `reportes`, `evidencias`, `desviaciones`, `recomendaciones`,
`compromisos`, `aprobaciones`, `versiones`, `mapa`, `comparacion`, `asignaciones`.

---

## 2. Capa de servicios adicionales

| Módulo | Directorio | Responsabilidad | Endpoints principales |
|--------|------------|-----------------|-----------------------|
| **Gestión de iniciativas** | `iniciativas/` (`controller`, `service`, `dto`) | CRUD de proyectos asociados a objetivos estratégicos: fechas, responsable, presupuesto, avance y estado | `GET/POST /iniciativas`, `GET/PATCH/DELETE /iniciativas/:id` |
| **Alertas automáticas** | `alertas/` | Generación masiva de alertas por KPI crítico en un período, más ciclo de vida (nueva → reconocida → resuelta/descartada) | `GET/POST /alertas`, `POST /alertas/generar?periodo=`, `PATCH /alertas/:id` |
| **Auditoría (log de cambios)** | `auditoria/` | Registro de eventos de modificación en toda la aplicación y lectura filtrable del historial | `GET /auditoria?entidad=&usuario=&limite=` |
| **Importación (integraciones)** | `importacion/` | Carga masiva de mediciones (`meta`, `real`, `nota`) desde CSV o filas JSON, con validación por compañía y reporte de errores | `POST /importacion/mediciones` |

Los cuatro módulos usan `JwtAuthGuard` + `RolesGuard` globales, registran sus operaciones en
`AuditoriaService.registrar()` y respetan el filtro multi-compañía (`?empresa=`).

---

## 3. Endpoints por módulo

### 3.1 `/iniciativas` — gestión de proyectos (Módulo 4)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/iniciativas?objetivo=&estado=&empresa=` | autenticado | Lista iniciativas (filtros por objetivo, estado y compañía) |
| `GET` | `/iniciativas/:id` | autenticado | Detalle de una iniciativa |
| `POST` | `/iniciativas` | ADMIN, GERENTE | Crea iniciativa (`codigo` único, `objetivoId` obligatorio) |
| `PATCH` | `/iniciativas/:id` | ADMIN, GERENTE, ANALISTA | Actualiza fechas, presupuesto, avance, estado, responsable |
| `DELETE` | `/iniciativas/:id` | ADMIN, GERENTE | Elimina iniciativa (auditoría `ELIMINAR`) |

### 3.2 `/alertas` — motor de notificaciones (Módulo 6)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/alertas?estado=&destinatario=&empresa=` | autenticado | Lista alertas; un `RESPONSABLE` solo ve las suyas (filtrado en servidor) |
| `POST` | `/alertas` | ADMIN, GERENTE | Alerta manual (mensaje, severidad, destinatario, KPI opcional) |
| `POST` | `/alertas/generar?periodo=<id>` | ADMIN, GERENTE, ANALISTA | Ejecuta el motor: genera alertas para todos los KPIs críticos del período |
| `PATCH` | `/alertas/:id` | autenticado | Cambia `estado` (NUEVA/RECONOCIDA/RESUELTA/DESCARTADA) y marca `leida` |

### 3.3 `/auditoria` — log de cambios (Módulo 9)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/auditoria?entidad=&usuario=&limite=` | ADMIN, GERENTE | Historial ordenado por fecha descendente (200 eventos por defecto) |

### 3.4 `/importacion` — carga masiva (Módulo 10)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `POST` | `/importacion/mediciones` | ADMIN, GERENTE, ANALISTA | Importa `meta`/`real`/`nota` de un período aceptando `{ csv }` o `{ filas: [{kpiId, meta, real, nota}] }`; devuelve `{ totalFilas, importadas, errores[] }` |

**Relacionados (Módulo 10):** `GET /reportes/objetivos/exportar` (CSV de los indicadores de
objetivos) y la API REST completa documentada en `README.md` §3, que actúa como conector
para sistemas externos.

---

## 4. Modelos de datos asociados (`backend/prisma/schema.prisma`)

| Modelo | Campos clave | Notas |
|--------|--------------|-------|
| `Iniciativa` | `codigo` (único), `nombre`, `descripcion`, `objetivoId` (FK), `kpiId?`, `responsableId?`, `fechaInicio`, `fechaFin?`, `presupuesto`, `avance`, `estado` | Estados: `PLANIFICADA`, `EN_CURSO`, `EN_RIESGO`, `COMPLETADA`, `CANCELADA` |
| `Alerta` | `empresaId`, `kpiId?`, `periodoId?`, `tipo` (p. ej. `KPI_CRITICO`, `MANUAL`), `severidad`, `mensaje`, `estado`, `destinatarioId?`, `leida`, `resueltaEn?` | Severidad: `INFO`, `ADVERTENCIA`, `CRITICA`. Índice por `empresaId` |
| `Auditoria` | `usuarioId?`, `accion`, `entidad`, `entidadId`, `detalle` (JSON), `createdAt` | El JSON `detalle` guarda el contexto de cada cambio |
| `Config` | `umbralCumplido`, `umbralAlerta`, `notificarCriticos`, reglas de agregación y formato | Activa/desactiva la generación automática de alertas |

---

## 5. Cobertura de los 10 módulos del diagrama funcional

| Módulo | Estado en la demo | Implementación | Especificación |
|--------|-------------------|----------------|----------------|
| 1–3, 5, 7, 8 | ✅ Cubiertos | Dashboard, perspectivas, períodos/simulador, reportes y administración (`README.md` §4, pestañas de la UI) | `README.md` §4 |
| **4 · Gestión de iniciativas** | ✅ Backend + UI | `/iniciativas`, `Tarea`+`ResultadoTarea`, `EventoCalendario`, pestaña **Iniciativas** | [`modulos-4-6-9-10.md`](modulos-4-6-9-10.md#módulo-4--gestión-de-iniciativas) |
| **6 · Alertas automáticas** | ✅ Motor + UI (faltan canales) | `/alertas`, `AlertasService.generarParaPeriodo()`, pestaña **Alertas** | [`modulos-4-6-9-10.md`](modulos-4-6-9-10.md#módulo-6--alertas-automáticas) |
| **9 · Auditoría** | ✅ Registro + UI | `AuditoriaService.registrar()` en 16 servicios (44 puntos de registro), pestaña **Auditoría** | [`modulos-4-6-9-10.md`](modulos-4-6-9-10.md#módulo-9--auditoría-log-de-cambios) |
| **10 · Integraciones** | ⚙️ Parcial (CSV + API) | `/importacion`, `/reportes/objetivos/exportar`, API REST con JWT | [`modulos-4-6-9-10.md`](modulos-4-6-9-10.md#módulo-10--integraciones) |

---

## 6. Reglas transversales

1. **Multi-compañía:** los listados aceptan `?empresa=` y el frontend lo envía automáticamente
   (`localStorage` `bsc_empresa`, por defecto `techperu`).
2. **Autenticación:** JWT con `JwtAuthGuard` global; `@Roles(...)` restringe escrituras;
   `@Public()` sólo en `GET /` y `POST /auth/login`.
3. **Auditoría:** cada escritura relevante invoca `AuditoriaService.registrar({ usuarioId,
   accion, entidad, entidadId, detalle })` de forma asíncrona (no bloquea la respuesta).
4. **Validación:** `ValidationPipe` global sobre los DTOs (`class-validator`).
5. **Errores:** excepciones de NestJS (`BadRequest`, `NotFound`, `Forbidden`) con mensajes
   en español.
