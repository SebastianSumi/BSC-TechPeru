import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  PERSPECTIVAS,
  KPIS,
  OBJETIVOS,
  RELACIONES_CAUSALES,
  FRECUENCIA_POR_PERSPECTIVA,
} from './seed-data.mjs';

const prisma = new PrismaClient();

const ROLES = [
  { nombre: 'ADMIN', descripcion: 'Acceso total: usuarios, períodos y KPIs' },
  { nombre: 'GERENTE', descripcion: 'Gestiona objetivos, períodos y asignaciones' },
  { nombre: 'ANALISTA', descripcion: 'Registra mediciones y genera reportes' },
  { nombre: 'RESPONSABLE', descripcion: 'Ve y reporta solo sus objetivos asignados' },
];

const USUARIOS = [
  { email: 'admin@techperu.pe', nombre: 'Administrador', password: 'admin123', rol: 'ADMIN' },
  { email: 'gerente@techperu.pe', nombre: 'Gerente General', password: 'gerente123', rol: 'GERENTE' },
  { email: 'analista@techperu.pe', nombre: 'Analista BSC', password: 'analista123', rol: 'ANALISTA' },
  { email: 'responsable@techperu.pe', nombre: 'Responsable Financiero', password: 'responsable123', rol: 'RESPONSABLE' },
];

const PERIODOS = [
  { nombre: '2025-Q1', anio: 2025, trimestre: 1, activo: false },
  { nombre: '2025-Q2', anio: 2025, trimestre: 2, activo: false },
  { nombre: '2025-Q3', anio: 2025, trimestre: 3, activo: false },
  { nombre: '2025-Q4', anio: 2025, trimestre: 4, activo: true },
];

function fechas(anio, trimestre) {
  const inicioMes = (trimestre - 1) * 3;
  const fechaInicio = new Date(Date.UTC(anio, inicioMes, 1));
  const fechaFin = new Date(Date.UTC(anio, inicioMes + 3, 0, 23, 59, 59));
  return { fechaInicio, fechaFin };
}

function formulaDe(kpi) {
  return kpi.inverso
    ? `min(${kpi.meta}; real) / real x 100`
    : `real / ${kpi.meta} x 100`;
}

function fuenteDe(kpi) {
  const fuentes = {
    financiera: 'Sistema contable ERP - Reporte financiero',
    clientes: 'CRM - Encuestas de satisfacción',
    procesos: 'Sistema de operaciones - Registros de calidad',
    aprendizaje: 'RRHH - Sistema de gestión del talento',
  };
  return fuentes[kpi.perspectivaId] ?? 'Sistema interno';
}

async function main() {
  for (const r of ROLES) {
    await prisma.rol.upsert({
      where: { nombre: r.nombre },
      update: { descripcion: r.descripcion },
      create: r,
    });
  }

  for (const p of PERSPECTIVAS) {
    await prisma.perspectiva.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }

  // Objetivos estratégicos
  const objetivoPorCodigo = {};
  for (const o of OBJETIVOS) {
    const obj = await prisma.objetivo.upsert({
      where: { codigo: o.codigo },
      update: o,
      create: o,
    });
    objetivoPorCodigo[o.codigo] = obj;
  }

  // KPIs (con objetivoId enlazado y metadatos de diccionario)
  for (const k of KPIS) {
    const prefijo = k.objetivo.split(':')[0].trim();
    const objetivoRef = objetivoPorCodigo[prefijo];
    const data = {
      id: k.id,
      perspectivaId: k.perspectivaId,
      objetivoId: objetivoRef?.id ?? null,
      objetivo: k.objetivo,
      nombre: k.nombre,
      unidad: k.unidad,
      meta: k.meta,
      real: k.real,
      inverso: k.inverso,
      tipo: k.inverso ? 'MENOR_MEJOR' : 'MAYOR_MEJOR',
      frecuencia: FRECUENCIA_POR_PERSPECTIVA[k.perspectivaId] ?? 'TRIMESTRAL',
      formula: formulaDe(k),
      fuenteDatos: fuenteDe(k),
      responsableValidacion: 'Analista BSC',
      umbralCumplido: 90,
      umbralAlerta: 75,
      accion: k.accion,
      orden: k.orden,
      activo: true,
      ponderacion: 0,
    };
    await prisma.kpi.upsert({
      where: { id: k.id },
      update: data,
      create: data,
    });
  }

  // Relaciones causales del mapa estratégico
  for (const rc of RELACIONES_CAUSALES) {
    const causa = objetivoPorCodigo[rc.causa];
    const efecto = objetivoPorCodigo[rc.efecto];
    if (!causa || !efecto) continue;
    await prisma.relacionCausal.upsert({
      where: { causaId_efectoId: { causaId: causa.id, efectoId: efecto.id } },
      update: { descripcion: rc.descripcion },
      create: { causaId: causa.id, efectoId: efecto.id, descripcion: rc.descripcion },
    });
  }

  // Usuarios
  const usuarioPorEmail = {};
  for (const u of USUARIOS) {
    const rol = await prisma.rol.findUnique({ where: { nombre: u.rol } });
    const passwordHash = await bcrypt.hash(u.password, 10);
    const usuario = await prisma.usuario.upsert({
      where: { email: u.email },
      update: { nombre: u.nombre, rolId: rol.id },
      create: { email: u.email, nombre: u.nombre, passwordHash, rolId: rol.id },
    });
    usuarioPorEmail[u.email] = usuario;
  }

  // Períodos
  const periodoPorNombre = {};
  for (const p of PERIODOS) {
    const { fechaInicio, fechaFin } = fechas(p.anio, p.trimestre);
    const periodo = await prisma.periodo.upsert({
      where: { nombre: p.nombre },
      update: { activo: p.activo, fechaInicio, fechaFin },
      create: { ...p, fechaInicio, fechaFin },
    });
    periodoPorNombre[p.nombre] = periodo;
  }

  // Asignaciones al responsable
  const resp = usuarioPorEmail['responsable@techperu.pe'];
  for (const kpiId of ['F1.1', 'F1.2', 'F2.1', 'C1.1']) {
    await prisma.asignacion.upsert({
      where: { usuarioId_kpiId: { usuarioId: resp.id, kpiId } },
      update: {},
      create: { usuarioId: resp.id, kpiId },
    });
  }

  // Mediciones base para Q4 (aprobadas) + mediciones históricas para Q1-Q3
  const q4 = periodoPorNombre['2025-Q4'];
  const analista = usuarioPorEmail['analista@techperu.pe'];
  const q1 = periodoPorNombre['2025-Q1'];
  const q2 = periodoPorNombre['2025-Q2'];
  const q3 = periodoPorNombre['2025-Q3'];
  const historicos = [q1, q2, q3];
  for (const k of KPIS) {
    await prisma.medicion.upsert({
      where: { kpiId_periodoId: { kpiId: k.id, periodoId: q4.id } },
      update: { meta: k.meta, real: k.real, estadoAprobacion: 'APROBADA', registradoPorId: analista.id },
      create: {
        kpiId: k.id,
        periodoId: q4.id,
        meta: k.meta,
        real: k.real,
        estadoAprobacion: 'APROBADA',
        registradoPorId: analista.id,
      },
    });
    historicos.forEach((per, idx) => {
      const factor = 0.85 + idx * 0.05; // Q1 85%, Q2 90%, Q3 95% del valor base aprox.
      const realHist = Math.round(k.real * factor * 100) / 100;
      prisma.medicion.upsert({
        where: { kpiId_periodoId: { kpiId: k.id, periodoId: per.id } },
        update: { meta: k.meta, real: realHist, estadoAprobacion: 'APROBADA', registradoPorId: analista.id },
        create: {
          kpiId: k.id,
          periodoId: per.id,
          meta: k.meta,
          real: realHist,
          estadoAprobacion: 'APROBADA',
          registradoPorId: analista.id,
        },
      });
    });
  }

  // Iniciativas estratégicas
  const gerente = usuarioPorEmail['gerente@techperu.pe'];
  const INICIATIVAS = [
    { codigo: 'INI-01', nombre: 'Programa de reducción de costos operativos', objetivo: 'OBJ-F3', responsable: resp.id, avance: 45, estado: 'EN_CURSO', presupuesto: 180000 },
    { codigo: 'INI-02', nombre: 'Campaña de re-engagement de clientes', objetivo: 'OBJ-C2', responsable: gerente.id, avance: 60, estado: 'EN_CURSO', presupuesto: 95000 },
    { codigo: 'INI-03', nombre: 'Automatización de procesos con RPA', objetivo: 'OBJ-P1', responsable: gerente.id, avance: 25, estado: 'EN_RIESGO', presupuesto: 220000 },
    { codigo: 'INI-04', nombre: 'Plan de capacitación y desarrollo 2025', objetivo: 'OBJ-A1', responsable: resp.id, avance: 70, estado: 'EN_CURSO', presupuesto: 40000 },
    { codigo: 'INI-05', nombre: 'Plataforma digital de gestión de ideas', objetivo: 'OBJ-A3', responsable: gerente.id, avance: 15, estado: 'PLANIFICADA', presupuesto: 60000 },
  ];
  for (const ini of INICIATIVAS) {
    await prisma.iniciativa.upsert({
      where: { codigo: ini.codigo },
      update: {
        nombre: ini.nombre,
        avance: ini.avance,
        estado: ini.estado,
        presupuesto: ini.presupuesto,
        responsableId: ini.responsable,
      },
      create: {
        codigo: ini.codigo,
        nombre: ini.nombre,
        descripcion: '',
        objetivoId: objetivoPorCodigo[ini.objetivo].id,
        responsableId: ini.responsable,
        presupuesto: ini.presupuesto,
        avance: ini.avance,
        estado: ini.estado,
      },
    });
  }

  // Alertas (KPIs críticos conocidos)
  const ALERTAS = [
    { kpiId: 'C2.3', severidad: 'CRITICA', mensaje: 'Churn Rate 7.2% supera la meta de 5%. Requiere acción inmediata.' },
    { kpiId: 'F3.1', severidad: 'ADVERTENCIA', mensaje: 'Ratio costo/ingreso 58.2% por encima de la meta de 55%.' },
    { kpiId: 'A2.2', severidad: 'CRITICA', mensaje: 'Rotación de personal 10% vs meta 8%.' },
    { kpiId: 'P2.3', severidad: 'ADVERTENCIA', mensaje: 'Ingresos de productos nuevos al 72% de la meta.' },
  ];
  const alertaExistente = await prisma.alerta.count();
  if (alertaExistente === 0) {
    for (const a of ALERTAS) {
      await prisma.alerta.create({
        data: {
          kpiId: a.kpiId,
          tipo: 'KPI_CRITICO',
          severidad: a.severidad,
          mensaje: a.mensaje,
          estado: 'NUEVA',
          destinatarioId: resp.id,
        },
      });
    }
  }

  // Análisis de desviaciones
  const desvExistente = await prisma.desviacion.count();
  if (desvExistente === 0) {
    await prisma.desviacion.createMany({
      data: [
        {
          kpiId: 'C2.3',
          periodoId: q4.id,
          causa: 'Falta de un equipo dedicado de Customer Success.',
          impacto: 'Pérdida de clientes recurrente y caída de ingresos.',
          medidaCorrectiva: 'Crear equipo de Customer Success y programa de fidelización.',
          responsableId: gerente.id,
          estado: 'EN_PROCESO',
        },
        {
          kpiId: 'A2.2',
          periodoId: q4.id,
          causa: 'Esquema de compensación no competitivo.',
          impacto: 'Mayor costo de reclutamiento y pérdida de conocimiento.',
          medidaCorrectiva: 'Revisar banda salarial y línea de carrera.',
          responsableId: resp.id,
          estado: 'PENDIENTE',
        },
      ],
    });
  }

  // Compromisos de reuniones de seguimiento
  const compExistente = await prisma.compromiso.count();
  if (compExistente === 0) {
    await prisma.compromiso.createMany({
      data: [
        {
          reunion: 'Comité estratégico Q3',
          descripcion: 'Presentar plan de reducción de costos operativos.',
          objetivoId: objetivoPorCodigo['OBJ-F3'].id,
          responsableId: resp.id,
          fechaLimite: new Date(Date.UTC(2025, 9, 15)),
          estado: 'EN_PROCESO',
        },
        {
          reunion: 'Comité estratégico Q3',
          descripcion: 'Implementar programa de re-engagement de clientes.',
          objetivoId: objetivoPorCodigo['OBJ-C2'].id,
          responsableId: gerente.id,
          fechaLimite: new Date(Date.UTC(2025, 8, 30)),
          estado: 'PENDIENTE',
        },
      ],
    });
  }

  // Calendario de evaluación
  const calExistente = await prisma.eventoCalendario.count();
  if (calExistente === 0) {
    await prisma.eventoCalendario.createMany({
      data: [
        { titulo: 'Cierre de mediciones Q4', tipo: 'CIERRE', fecha: new Date(Date.UTC(2026, 0, 10)), periodoId: q4.id, responsableId: analista.id },
        { titulo: 'Entrega de mediciones Q4', tipo: 'ENTREGA', fecha: new Date(Date.UTC(2026, 0, 5)), periodoId: q4.id, responsableId: resp.id },
        { titulo: 'Validación y publicación Q4', tipo: 'PUBLICACION', fecha: new Date(Date.UTC(2026, 0, 20)), periodoId: q4.id, responsableId: gerente.id },
      ],
    });
  }

  // Versión del plan estratégico
  const verExistente = await prisma.planVersion.count();
  if (verExistente === 0) {
    await prisma.planVersion.create({
      data: {
        version: 'v1.0',
        descripcion: 'Plan estratégico TechPeru 2025 - versión inicial.',
        periodoId: q4.id,
        estado: 'VIGENTE',
        publicadoPor: 'Gerente General',
        vigenteDesde: new Date(),
        snapshot: { perspectivas: PERSPECTIVAS.length, objetivos: OBJETIVOS.length, kpis: KPIS.length },
      },
    });
  }

  // Configuración global
  await prisma.config.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      empresa: 'TechPeru SAC',
      anioBase: 2025,
      umbralCumplido: 90,
      umbralAlerta: 75,
      notificarCriticos: true,
      requiereAprobacion: false,
      requiereEvidencia: false,
    },
  });

  // Evidencia de ejemplo
  const evidExistente = await prisma.evidencia.count();
  if (evidExistente === 0) {
    const medCac = await prisma.medicion.findUnique({
      where: { kpiId_periodoId: { kpiId: 'F3.2', periodoId: q4.id } },
    });
    if (medCac) {
      await prisma.evidencia.create({
        data: {
          medicionId: medCac.id,
          kpiId: 'F3.2',
          tipo: 'ENLACE',
          titulo: 'Reporte de costos de adquisición Q4',
          url: 'https://intranet.techperu.pe/reportes/cac-q4',
          descripcion: 'Detalle del cálculo del CAC por canal.',
          subidoPorId: analista.id,
        },
      });
    }
  }

  console.log(
    `Seed OK: ${ROLES.length} roles, ${PERSPECTIVAS.length} perspectivas, ${OBJETIVOS.length} objetivos, ${KPIS.length} KPIs, ${USUARIOS.length} usuarios, ${PERIODOS.length} períodos, ${INICIATIVAS.length} iniciativas`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
