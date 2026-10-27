# Roadmap — Fase 4 y Fase 5 ampliadas

Detalle de las dos próximas fases del proyecto, ampliadas con los módulos 4, 6, 9 y 10 del
diagrama funcional. El resumen ejecutable vive en `README.md` §7; este documento es la
especificación de trabajo.

- Especificaciones de los módulos → [`modulos-4-6-9-10.md`](modulos-4-6-9-10.md)
- Arquitectura y servicios → [`arquitectura.md`](arquitectura.md)

---

## Fase 4 — Integraciones y gestión de proyectos

> **Objetivo:** que los datos entren y salgan masivamente (Excel/ERP/CRM) y que los proyectos
> asociados a objetivos estratégicos se gestionen con desglose real de actividades y
> presupuesto.

### 4.1 Carga y exportación de datos (Módulo 10)

- [x] Importación masiva de mediciones en **CSV** o `filas` JSON (`POST /importacion/mediciones`)
      con validación por fila, reporte de errores y auditoría.
- [x] Exportación a **CSV** de los reportes por objetivo (`GET /reportes/objetivos/exportar`).
- [ ] Carga desde **Excel (.xlsx)** con plantilla descargable y modo previa (`dryRun`).
- [ ] Exportación masiva en XLSX/CSV: KPIs, objetivos, alertas y auditoría.
- [ ] Gestión de plantillas/mapeo de columnas por compañía.

### 4.2 Conectores ERP/CRM (Módulo 10)

- [ ] Especificación del contrato de conectores (OAuth2 saliente, webhooks entrantes firmados
      con HMAC, idempotencia por `empresaId + entidad + periodo`).
- [ ] Sincronización programada (cron configurable) de mediciones y objetivos con reintentos.
- [ ] Catálogo de conectores en `Config` (habilitado, credenciales cifradas, última
      sincronización) y errores visibles en alertas/auditoría.
- [ ] Documentación de API pública (OpenAPI) como conector oficial.

### 4.3 Gestión de iniciativas con desglose (Módulo 4)

- [x] CRUD de iniciativas vinculadas a objetivos/KPIs con fechas, responsable, presupuesto,
      avance y estados (`/iniciativas` + pestaña **Iniciativas**).
- [x] Desglose de actividades mediante `Tarea` con resultados validables y evidencias.
- [x] Hitos y fechas clave en `EventoCalendario` (pestaña **Calendario**).
- [ ] Vincular `Tarea` a `Iniciativa` (`iniciativaId` opcional) para ver actividades dentro
      del proyecto.
- [ ] Recursos y presupuesto por actividad: costo estimado/real, moneda por compañía y
      avance derivado del avance de las tareas.
- [ ] Panel de proyecto: Gantt simplificado, carga por responsable y alerta de quiebre de
      presupuesto.

### 4.4 Entregables

- [ ] **Exportación de reportes a PDF** (capítulos: resumen ejecutivo, semáforo, KPIs
      críticos, detalle por perspectiva).
- [ ] Múltiples **escenarios guardados** del simulador (guardar/recuperar/comparar).
- [ ] Pruebas E2E de importación → reporte → exportación.

---

## Fase 5 — Alertas automáticas y auditoría detallada

> **Objetivo:** completar el motor de notificaciones (correos y tiempo real) y elevar la
> auditoría a un historial campo a campo de cada KPI.

### 5.1 Canales del motor de alertas (Módulo 6)

- [x] Motor de detección de KPIs críticos por período (`POST /alertas/generar`), con
      interruptor global (`Config.notificarCriticos`), reglas por compañía, severidad
      (`CRITICA` si cumplimiento < 60 %) y control de duplicados.
- [x] Ciclo de vida de la alerta (NUEVA → RECONOCIDA → RESUELTA/DESCARTADA), `leida`,
      destinatario y visión restringida para `RESPONSABLE`.
- [ ] **Envío de correos** (SMTP + plantillas HTML, reintentos y registro de envío).
- [ ] **Avisos en tiempo real** (SSE/WebSocket) para el índice de campana sin recargar.
- [ ] Alertas por **retraso de iniciativas/tareas** (`INICIATIVA_RETRASADA`, cron diario).
- [ ] Reglas ampliadas: umbrales por tipo, digest diario/resumen semanal, supresión de ruido.

### 5.2 Auditoría campo a campo (Módulo 9)

- [x] Servicio de registro transversal (`AuditoriaService.registrar`) en 16 servicios
      (44 puntos) y lectura filtrable (`GET /auditoria`) para ADMIN/GERENTE con pestaña
      **Auditoría**.
- [ ] Diff **anterior → nuevo por campo** en las modificaciones de KPI (`detalle.campos[]`),
      tomando el registro previo antes del `update`.
- [ ] UI de historial: desplegable por fila con `campo | anterior → nuevo`, filtros por
      entidad, usuario y rango de fechas.
- [ ] `empresaId` en `Auditoria` para filtrar el log por compañía.
- [ ] Exportación CSV del historial y retención configurable (p. ej. 24 meses).

### 5.3 Entregables

- [ ] Verificación E2E: medición fuera de umbral → alerta generada → correo recibido →
      resolución registrada en auditoría con diff de campos.
- [ ] Actualización de `README.md` §6 con los valores de verificación de las fases 4 y 5.

---

## Estado resumido

| Fase | Alcance | Estado |
|------|---------|--------|
| 1–3 | Demo frontend, backend NestJS/Prisma/Postgres, auth+roles+períodos+reportes | ✅ Completada |
| **4** | Integraciones (Excel, exportaciones, ERP/CRM) + gestión de iniciativas con presupuesto | 🔄 En curso (base de `/iniciativas` e importación CSV lista) |
| **5** | Alertas automáticas con canales (correo/tiempo real) + auditoría campo a campo | ⬜ Pendiente (motor y log base listos) |
