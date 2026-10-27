import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CumplimientoService } from '../cumplimiento/cumplimiento.service.js';
import { contarEstados } from '../bsc/bsc.logic.js';
import { clasificarEstado } from '../cumplimiento/cumplimiento.logic.js';

interface FiltrosReporte {
  empresaId?: string;
  perspectivaId?: string;
  responsableId?: string;
  periodoId?: string;
  estado?: string;
  usuarioId?: string;
}

export interface KpiReporte {
  id: string;
  codigo: string | null;
  nombre: string;
  perspectivaId: string;
  perspectivaNombre: string;
  responsableId: string | null;
  responsableNombre: string | null;
  meta: number;
  real: number;
  unidad: string;
  unidadMedida: string | null;
  ponderacion: number;
  cumplimiento: number;
  estado: string;
  estadoKey: string;
  porcentaje: string;
  recomendacionFijada: string | null;
}

@Injectable()
export class ReportesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cumplimiento: CumplimientoService,
  ) {}

  private async reglasEmpresa(empresaId: string) {
    return this.cumplimiento.reglas(empresaId);
  }

  private construirKpi(
    kpi: {
      id: string;
      codigo: string | null;
      nombre: string;
      perspectivaId: string;
      perspectiva: { nombre: string };
      responsableId: string | null;
      responsable: { nombre: string } | null;
      meta: unknown;
      real: unknown;
      unidad: string;
      unidadMedida: string | null;
      ponderacion: number;
    },
    reglas: Awaited<ReturnType<CumplimientoService['reglas']>>,
    medicion?: { meta: unknown; real: unknown } | null,
    recomendacionFijada?: string | null,
  ): KpiReporte {
    const evaluado = this.cumplimiento.evaluar(kpi, reglas, medicion);
    return {
      id: kpi.id,
      codigo: kpi.codigo,
      nombre: kpi.nombre,
      perspectivaId: kpi.perspectivaId,
      perspectivaNombre: kpi.perspectiva.nombre,
      responsableId: kpi.responsableId,
      responsableNombre: kpi.responsable?.nombre ?? null,
      meta: evaluado.meta,
      real: evaluado.real,
      unidad: kpi.unidad,
      unidadMedida: kpi.unidadMedida,
      ponderacion: kpi.ponderacion,
      cumplimiento: evaluado.mostrado,
      estado: evaluado.estado,
      estadoKey: evaluado.estadoKey,
      porcentaje: evaluado.porcentaje,
      recomendacionFijada: recomendacionFijada ?? null,
    };
  }

  private async datos(filtros: FiltrosReporte) {
    const empresaId = filtros.empresaId ?? 'techperu';
    const reglas = await this.reglasEmpresa(empresaId);
    const objetivos = await this.prisma.objetivo.findMany({
      where: {
        empresaId,
        activo: true,
        ...(filtros.perspectivaId
          ? { perspectivaId: filtros.perspectivaId }
          : {}),
        ...(filtros.responsableId
          ? { responsableId: filtros.responsableId }
          : {}),
        ...(filtros.usuarioId
          ? {
              OR: [
                { responsableId: filtros.usuarioId },
                {
                  kpis: {
                    some: {
                      OR: [
                        { responsableId: filtros.usuarioId },
                        {
                          asignaciones: {
                            some: { usuarioId: filtros.usuarioId },
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        perspectiva: true,
        responsable: { select: { id: true, nombre: true } },
        kpis: {
          where: { activo: true },
          include: {
            perspectiva: true,
            responsable: { select: { id: true, nombre: true } },
            mediciones: filtros.periodoId
              ? { where: { periodoId: filtros.periodoId } }
              : false,
          },
          orderBy: { orden: 'asc' },
        },
        tareas: {
          select: { id: true, estado: true, avance: true },
        },
      },
      orderBy: [
        { perspectiva: { orden: 'asc' } },
        { orden: 'asc' },
        { codigo: 'asc' },
      ],
    });

    const objetivoIds = objetivos.map((o) => o.id);
    const kpiIds = objetivos.flatMap((o) => o.kpis.map((k) => k.id));
    const fijadas = await this.prisma.recomendacion.findMany({
      where: {
        fijada: true,
        OR: [
          { objetivoId: { in: objetivoIds } },
          { kpiId: { in: kpiIds } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });
    const fijadaPorObjetivo = new Map<string, string>();
    const fijadaPorKpi = new Map<string, string>();
    for (const rec of fijadas) {
      if (rec.objetivoId && !fijadaPorObjetivo.has(rec.objetivoId)) {
        fijadaPorObjetivo.set(rec.objetivoId, rec.contenido);
      }
      if (rec.kpiId && !fijadaPorKpi.has(rec.kpiId)) {
        fijadaPorKpi.set(rec.kpiId, rec.contenido);
      }
    }

    return {
      empresaId,
      reglas,
      objetivos: objetivos.map((objetivo) => {
        const kpis = objetivo.kpis.map((kpi) =>
          this.construirKpi(
            kpi,
            reglas,
            (kpi.mediciones as { meta: unknown; real: unknown }[] | undefined)?.[0] ??
              null,
            fijadaPorKpi.get(kpi.id),
          ),
        );
        const cumplimiento = this.cumplimiento.agregarObjetivo(
          kpis.map((k) => ({
            cumplimiento: k.cumplimiento,
            ponderacion: k.ponderacion,
          })),
          reglas.agregacionObjetivo,
        );
        const estado = clasificarEstado(
          cumplimiento,
          reglas.umbralCumplido ?? 90,
          reglas.umbralAlerta ?? 75,
        );
        return {
          id: objetivo.id,
          codigo: objetivo.codigo,
          nombre: objetivo.nombre,
          descripcion: objetivo.descripcion,
          perspectivaId: objetivo.perspectivaId,
          perspectivaNombre: objetivo.perspectiva.nombre,
          perspectivaColor: objetivo.perspectiva.color,
          responsableId: objetivo.responsableId,
          responsableNombre: objetivo.responsable?.nombre ?? null,
          ponderacion: objetivo.ponderacion,
          cumplimiento,
          estado,
          estadoKey:
            estado === 'LOGRADO'
              ? 'logrado'
              : estado === 'EN_RIESGO'
                ? 'riesgo'
                : 'critico',
          totalKpis: kpis.length,
          ...contarEstados(
            kpis.map((k) => ({ estado: k.estadoKey as 'logrado' | 'riesgo' | 'critico' })),
          ),
          recomendacionFijada: fijadaPorObjetivo.get(objetivo.id) ?? null,
          tareas: {
            total: objetivo.tareas.length,
            pendientes: objetivo.tareas.filter((t) => t.estado === 'PENDIENTE')
              .length,
            enProceso: objetivo.tareas.filter((t) => t.estado === 'EN_PROCESO')
              .length,
            completadas: objetivo.tareas.filter(
              (t) => t.estado === 'COMPLETADA',
            ).length,
          },
          kpis,
        };
      }),
    };
  }

  async reporteObjetivos(filtros: FiltrosReporte) {
    const datos = await this.datos(filtros);
    const estadoFiltro = filtros.estado?.toUpperCase();
    const objetivos = estadoFiltro
      ? datos.objetivos.filter((o) => o.estado === estadoFiltro)
      : datos.objetivos;

    return {
      generadoEn: new Date().toISOString(),
      filtros: {
        ...filtros,
        empresaId: datos.empresaId,
      },
      reglas: datos.reglas,
      resumen: {
        totalObjetivos: objetivos.length,
        totalKpis: objetivos.reduce((acc, o) => acc + o.totalKpis, 0),
        promedioObjetivos:
          objetivos.length === 0
            ? 0
            : Math.round(
                (objetivos.reduce((acc, o) => acc + o.cumplimiento, 0) /
                  objetivos.length) *
                  100,
              ) / 100,
        logrados: objetivos.filter((o) => o.estado === 'LOGRADO').length,
        enRiesgo: objetivos.filter((o) => o.estado === 'EN_RIESGO').length,
        criticos: objetivos.filter((o) => o.estado === 'CRITICO').length,
      },
      objetivos,
    };
  }

  async detalleObjetivo(id: string, filtros: FiltrosReporte) {
    const reporte = await this.reporteObjetivos({ ...filtros, empresaId: filtros.empresaId });
    const objetivo = reporte.objetivos.find((o) => o.id === id);
    if (!objetivo) throw new NotFoundException('Objetivo no encontrado o sin acceso');

    const [tareas, evidencias, versiones, kpisConHistorial] = await Promise.all([
      this.prisma.tarea.findMany({
        where: { objetivoId: id },
        include: {
          responsable: { select: { id: true, nombre: true } },
          resultados: true,
          _count: { select: { evidencias: true } },
        },
        orderBy: [{ estado: 'asc' }, { fechaFin: 'asc' }],
      }),
      this.prisma.evidencia.findMany({
        where: {
          OR: [
            { tarea: { objetivoId: id } },
            { kpi: { objetivoId: id } },
          ],
        },
        include: { subidoPor: { select: { id: true, nombre: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.planVersion.findMany({
        where: { empresaId: reporte.filtros.empresaId },
        select: {
          id: true,
          version: true,
          descripcion: true,
          estado: true,
          periodoId: true,
          createdAt: true,
          vigenteDesde: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.kpi.findMany({
        where: { objetivoId: id, activo: true },
        include: {
          mediciones: {
            include: { periodo: true },
            orderBy: [{ periodo: { anio: 'desc' } }, { periodo: { trimestre: 'desc' } }],
            take: 12,
          },
        },
        orderBy: { orden: 'asc' },
      }),
    ]);

    const reglas = reporte.reglas;
    const historialPorKpi = new Map(
      kpisConHistorial.map((kpi) => [
        kpi.id,
        kpi.mediciones.map((m) => {
          const evaluado = this.cumplimiento.evaluar(kpi, reglas, m);
          return {
            medicionId: m.id,
            periodoId: m.periodoId,
            periodo: m.periodo.nombre,
            anio: m.periodo.anio,
            trimestre: m.periodo.trimestre,
            meta: evaluado.meta,
            real: evaluado.real,
            cumplimiento: evaluado.mostrado,
            estado: evaluado.estado,
            estadoKey: evaluado.estadoKey,
            porcentaje: evaluado.porcentaje,
          };
        }),
      ]),
    );

    return {
      ...objetivo,
      kpis: objetivo.kpis.map((kpi) => ({
        ...kpi,
        historial: historialPorKpi.get(kpi.id) ?? [],
      })),
      tareasDetalle: tareas.map((tarea) => ({
        id: tarea.id,
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        estado: tarea.estado,
        avance: Number(tarea.avance),
        fechaInicio: tarea.fechaInicio,
        fechaFin: tarea.fechaFin,
        responsable: tarea.responsable,
        totalResultados: tarea.resultados.length,
        resultadosValidados: tarea.resultados.filter(
          (r) => r.estadoValidacion === 'VALIDADO',
        ).length,
        totalEvidencias: tarea._count.evidencias,
      })),
      evidencias: evidencias.map((e) => ({
        id: e.id,
        titulo: e.titulo,
        tipo: e.tipo,
        url: e.url,
        nombreArchivo: e.nombreArchivo,
        descripcion: e.descripcion,
        createdAt: e.createdAt,
        subidoPor: e.subidoPor,
      })),
      versiones,
    };
  }

  async exportarCsv(filtros: FiltrosReporte) {
    const reporte = await this.reporteObjetivos(filtros);
    const encabezado = [
      'Empresa',
      'Perspectiva',
      'Codigo objetivo',
      'Objetivo',
      'Responsable objetivo',
      'Cumplimiento objetivo',
      'Estado objetivo',
      'Recomendacion fijada',
      'Codigo KPI',
      'KPI',
      'Responsable KPI',
      'Meta',
      'Real',
      'Cumplimiento KPI',
      'Estado KPI',
    ];
    const filas: string[][] = [encabezado];
    for (const objetivo of reporte.objetivos) {
      const kpis = objetivo.kpis.length > 0 ? objetivo.kpis : [null];
      for (const kpi of kpis) {
        filas.push([
          reporte.filtros.empresaId,
          objetivo.perspectivaNombre,
          objetivo.codigo,
          objetivo.nombre,
          objetivo.responsableNombre ?? '',
          objetivo.cumplimiento.toFixed(2),
          objetivo.estado,
          objetivo.recomendacionFijada ?? '',
          kpi?.codigo ?? '',
          kpi?.nombre ?? '',
          kpi?.responsableNombre ?? '',
          kpi ? String(kpi.meta) : '',
          kpi ? String(kpi.real) : '',
          kpi ? kpi.cumplimiento.toFixed(2) : '',
          kpi?.estado ?? '',
        ]);
      }
    }
    const contenido = filas
      .map((fila) =>
        fila
          .map((valor) => `"${String(valor).replace(/"/g, '""')}"`)
          .join(';'),
      )
      .join('\r\n');
    const fecha = new Date().toISOString().slice(0, 10);
    return {
      nombreArchivo: `reporte-objetivos-${reporte.filtros.empresaId}-${fecha}.csv`,
      contenido: `\uFEFF${contenido}`,
    };
  }
}
