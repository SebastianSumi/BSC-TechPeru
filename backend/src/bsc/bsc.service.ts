import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  calcularCumplimiento,
  calcularIndice,
  clasificarEstado,
  contarEstados,
} from './bsc.logic.js';

interface KpiBase {
  id: string;
  perspectivaId: string;
  objetivo: string;
  nombre: string;
  unidad: string;
  meta: number;
  real: number;
  inverso: boolean;
  accion: string;
}

interface MedicionLike {
  meta: number;
  real: number;
}

@Injectable()
export class BscService {
  constructor(private readonly prisma: PrismaService) {}

  private evaluar(kpi: KpiBase, medicion?: MedicionLike) {
    const meta = medicion?.meta ?? kpi.meta;
    const real = medicion?.real ?? kpi.real;
    const cumplimiento = calcularCumplimiento(meta, real, kpi.inverso);
    return {
      ...kpi,
      meta,
      real,
      cumplimiento,
      estado: clasificarEstado(cumplimiento),
    };
  }

  async getPerspectivas() {
    return this.prisma.perspectiva.findMany({ orderBy: { orden: 'asc' } });
  }

  async getKpis(
    perspectivaId?: string,
    periodoId?: string,
    empresaId?: string,
  ) {
    const kpis = await this.prisma.kpi.findMany({
      where: {
        ...(perspectivaId ? { perspectivaId } : {}),
        ...(empresaId ? { empresaId } : {}),
      },
      orderBy: [{ perspectivaId: 'asc' }, { orden: 'asc' }],
      include: periodoId
        ? { mediciones: { where: { periodoId } } }
        : undefined,
    });
    return kpis.map((k) => {
      const { mediciones, ...base } = k as KpiBase & {
        mediciones?: MedicionLike[];
        orden?: number;
      };
      return this.evaluar(base, mediciones?.[0]);
    });
  }

  async getKpi(id: string, periodoId?: string) {
    const kpi = await this.prisma.kpi.findUnique({
      where: { id },
      include: periodoId ? { mediciones: { where: { periodoId } } } : undefined,
    });
    if (!kpi) throw new NotFoundException(`KPI ${id} no encontrado`);
    const { mediciones, ...base } = kpi as KpiBase & {
      mediciones?: MedicionLike[];
    };
    return this.evaluar(base, mediciones?.[0]);
  }

  async getResumen(periodoId?: string, empresaId?: string) {
    const evaluados = await this.getKpis(undefined, periodoId, empresaId);
    const estados = contarEstados(evaluados);
    const perspectivas = await this.prisma.perspectiva.findMany({
      orderBy: { orden: 'asc' },
    });

    const porPerspectiva = perspectivas.map((p) => {
      const de = evaluados.filter((k) => k.perspectivaId === p.id);
      const e = contarEstados(de);
      return {
        ...p,
        indiceGlobal: calcularIndice(de),
        ...e,
        total: de.length,
      };
    });

    return {
      indiceGlobal: calcularIndice(evaluados),
      ...estados,
      total: evaluados.length,
      porPerspectiva,
    };
  }

  async getMediciones(kpiId: string) {
    return this.prisma.medicion.findMany({
      where: { kpiId },
      include: { periodo: true },
      orderBy: { periodo: { anio: 'desc' } },
    });
  }

  async upsertMedicion(kpiId: string, dto: {
    periodoId: string;
    meta: number;
    real: number;
    nota?: string;
  }) {
    await this.getKpi(kpiId);
    const medicion = await this.prisma.medicion.upsert({
      where: { kpiId_periodoId: { kpiId, periodoId: dto.periodoId } },
      update: { meta: dto.meta, real: dto.real, nota: dto.nota },
      create: {
        kpiId,
        periodoId: dto.periodoId,
        meta: dto.meta,
        real: dto.real,
        nota: dto.nota,
      },
    });
    return medicion;
  }

  async setReal(id: string, real: number) {
    await this.getKpi(id);
    const kpi = await this.prisma.kpi.update({
      where: { id },
      data: { real },
    });
    return this.evaluar(kpi as KpiBase);
  }

  async reporte(params: {
    perspectivaId?: string;
    periodoId?: string;
    usuarioId?: string;
    empresaId?: string;
  }) {
    let kpiIds: string[] | undefined;
    if (params.usuarioId) {
      const asigs = await this.prisma.asignacion.findMany({
        where: { usuarioId: params.usuarioId },
      });
      kpiIds = asigs.map((a) => a.kpiId);
    }

    const kpis = await this.prisma.kpi.findMany({
      where: {
        ...(params.perspectivaId ? { perspectivaId: params.perspectivaId } : {}),
        ...(params.empresaId ? { empresaId: params.empresaId } : {}),
        ...(kpiIds ? { id: { in: kpiIds } } : {}),
      },
      orderBy: [{ perspectivaId: 'asc' }, { orden: 'asc' }],
      include: params.periodoId
        ? { mediciones: { where: { periodoId: params.periodoId } } }
        : undefined,
    });

    const evaluados = kpis.map((k) => {
      const { mediciones, ...base } = k as KpiBase & {
        mediciones?: MedicionLike[];
      };
      return this.evaluar(base, mediciones?.[0]);
    });

    const perspectivas = await this.prisma.perspectiva.findMany({
      orderBy: { orden: 'asc' },
    });
    const porPerspectiva = perspectivas
      .map((p) => {
        const de = evaluados.filter((k) => k.perspectivaId === p.id);
        if (de.length === 0) return null;
        return {
          id: p.id,
          nombre: p.nombre,
          icono: p.icono,
          color: p.color,
          indiceGlobal: calcularIndice(de),
          ...contarEstados(de),
          total: de.length,
        };
      })
      .filter(Boolean);

    return {
      generadoEn: new Date().toISOString(),
      filtros: params,
      resumen: {
        indiceGlobal: calcularIndice(evaluados),
        ...contarEstados(evaluados),
        total: evaluados.length,
      },
      porPerspectiva,
      kpis: evaluados,
      criticos: evaluados
        .filter((k) => k.estado === 'critico')
        .sort((a, b) => a.cumplimiento - b.cumplimiento),
    };
  }
}
