import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PERSPECTIVAS, KPIS } from './seed-data.mjs';

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

async function main() {
  for (const r of ROLES) {
    await prisma.rol.upsert({
      where: { nombre: r.nombre },
      update: { descripcion: r.descripcion },
      create: r,
    });
  }

  for (const p of PERSPECTIVAS) {
    await prisma.perspectiva.upsert({ where: { id: p.id }, update: p, create: p });
  }

  for (const k of KPIS) {
    await prisma.kpi.upsert({ where: { id: k.id }, update: k, create: k });
  }

  for (const u of USUARIOS) {
    const rol = await prisma.rol.findUnique({ where: { nombre: u.rol } });
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: { nombre: u.nombre, rolId: rol.id },
      create: {
        email: u.email,
        nombre: u.nombre,
        passwordHash,
        rolId: rol.id,
      },
    });
  }

  for (const p of PERIODOS) {
    const { fechaInicio, fechaFin } = fechas(p.anio, p.trimestre);
    await prisma.periodo.upsert({
      where: { nombre: p.nombre },
      update: { activo: p.activo, fechaInicio, fechaFin },
      create: { ...p, fechaInicio, fechaFin },
    });
  }

  const resp = await prisma.usuario.findUnique({
    where: { email: 'responsable@techperu.pe' },
  });
  for (const kpiId of ['F1.1', 'F1.2', 'F2.1', 'C1.1']) {
    await prisma.asignacion.upsert({
      where: { usuarioId_kpiId: { usuarioId: resp.id, kpiId } },
      update: {},
      create: { usuarioId: resp.id, kpiId },
    });
  }

  const q4 = await prisma.periodo.findUnique({ where: { nombre: '2025-Q4' } });
  for (const k of KPIS) {
    await prisma.medicion.upsert({
      where: { kpiId_periodoId: { kpiId: k.id, periodoId: q4.id } },
      update: { meta: k.meta, real: k.real },
      create: {
        kpiId: k.id,
        periodoId: q4.id,
        meta: k.meta,
        real: k.real,
      },
    });
  }

  console.log(
    `Seed OK: ${ROLES.length} roles, ${PERSPECTIVAS.length} perspectivas, ${KPIS.length} KPIs, ${USUARIOS.length} usuarios, ${PERIODOS.length} períodos`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
