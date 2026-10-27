import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CumplimientoService,
  type KpiEvaluable,
} from '../cumplimiento/cumplimiento.service.js';

type EstadoKey = 'logrado' | 'riesgo' | 'critico';

@Injectable()
export class BscService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cumplimiento: CumplimientoService,
  ) {}

  private evaluarKpi<T extends object>(
    kpi: T,
    reglas: Awaited<ReturnType<CumplimientoService['reglas']>>,
    medicion?: { meta: unknown; real: unknown } | null,
  ) {
    const evaluado = this.cumplimiento.evaluar(
      kpi as KpiEvaluable,
      reglas,
      medicion ?? null,
    );
    return {
      ...kpi,
      meta: evaluado.meta,
      real: evaluado.real,
      cumplimiento: evaluado.mostrado,
      cumplimientoBruto: evaluado.bruto,
      porcentaje: evaluado.porcentaje,
      estado: evaluado.estadoKey,
      estadoKey: evaluado.estadoKey,
      formulaCalculo: evaluado.formula,
      valido: evaluado.valido,
    };
  }

  private contar(evaluados: { estado: EstadoKey }[]) {
    return {
      logrado: evaluados.filter((k) => k.estado === 'logrado').length,
      riesgo: evaluados.filter((k) => k.estado === 'riesgo').length,
      critico: evaluados.filter((k) => k.estado === 'critico').length,
    };
  }

  private indice(
    evaluados: { cumplimiento: number; ponderacion?: number | null }[],
    regla: string,
  ) {
    return this.cumplimiento.agregarObjetivo(evaluados, regla);
  }

  async getPerspectivas(empresaId?: string) {
    return this.prisma.perspectiva.findMany({
      where: empresaId
        ? { OR: [{ empresaId }, { empresaId: null }] }
        : undefined,
      orderBy: { orden: 'asc' },
    });
  }

  async getKpis(
    perspectivaId?: string,
    periodoId?: string,
    empresaId?: string,
  ) {
    const [kpis, reglas] = await Promise.all([
      this.prisma.kpi.findMany({
        where: {
          ...(perspectivaId ? { perspectivaId } : {}),
          ...(empresaId ? { empresaId } : {}),
        },
        orderBy: [{ perspectivaId: 'asc' }, { orden: 'asc' }],
        include: periodoId
          ? { mediciones: { where: { periodoId } } }
          : undefined,
      }),
      this.cumplimiento.reglas(empresaId),
    ]);
    return kpis.map((k) => {
      const { mediciones, ...base } = k as typeof k & {
        mediciones?: { meta: unknown; real: unknown }[];
      };
      return this.evaluarKpi(base, reglas, mediciones?.[0]);
    });
  }

  async getKpi(id: string, periodoId?: string) {
    const kpi = await this.prisma.kpi.findUnique({
      where: { id },
      include: periodoId ? { mediciones: { where: { periodoId } } } : undefined,
    });
    if (!kpi) throw new NotFoundException(`KPI ${id} no encontrado`);
    const { mediciones, ...base } = kpi as typeof kpi & {
      mediciones?: { meta: unknown; real: unknown }[];
    };
    const reglas = await this.cumplimiento.reglas(kpi.empresaId);
    return this.evaluarKpi(base, reglas, mediciones?.[0]);
  }

  async getResumen(periodoId?: string, empresaId?: string) {
    const [evaluados, perspectivas, reglas] = await Promise.all([
      this.getKpis(undefined, periodoId, empresaId),
      this.getPerspectivas(empresaId),
      this.cumplimiento.reglas(empresaId),
    ]);
    const estados = this.contar(evaluados as { estado: EstadoKey }[]);

    const porPerspectiva = perspectivas.map((p) => {
      const de = evaluados.filter((k) => k.perspectivaId === p.id);
      return {
        ...p,
        indiceGlobal: this.indice(
          de.map((k) => ({
            cumplimiento: k.cumplimiento,
            ponderacion: k.ponderacion,
          })),
          reglas.agregacionObjetivo,
        ),
        ...this.contar(de as { estado: EstadoKey }[]),
        total: de.length,
      };
    });

    return {
      indiceGlobal: this.indice(
        evaluados.map((k) => ({
          cumplimiento: k.cumplimiento,
          ponderacion: k.ponderacion,
        })),
        reglas.agregacionObjetivo,
      ),
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

  async upsertMedicion(
    kpiId: string,
    dto: {
      periodoId: string;
      meta: number;
      real: number;
      nota?: string;
    },
  ) {
    await this.getKpi(kpiId);
    return this.prisma.medicion.upsert({
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
  }

  async setReal(id: string, real: number) {
    await this.getKpi(id);
    const kpi = await this.prisma.kpi.update({
      where: { id },
      data: { real },
    });
    const reglas = await this.cumplimiento.reglas(kpi.empresaId);
    return this.evaluarKpi(kpi, reglas);
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

    const [todos, perspectivas, reglas] = await Promise.all([
      this.getKpis(params.perspectivaId, params.periodoId, params.empresaId),
      this.getPerspectivas(params.empresaId),
      this.cumplimiento.reglas(params.empresaId),
    ]);
    const evaluados = kpiIds
      ? todos.filter((k) => kpiIds?.includes(k.id))
      : todos;

    const porPerspectiva = perspectivas
      .map((p) => {
        const de = evaluados.filter((k) => k.perspectivaId === p.id);
        if (de.length === 0) return null;
        return {
          id: p.id,
          nombre: p.nombre,
          icono: p.icono,
          color: p.color,
          indiceGlobal: this.indice(
            de.map((k) => ({
              cumplimiento: k.cumplimiento,
              ponderacion: k.ponderacion,
            })),
            reglas.agregacionObjetivo,
          ),
          ...this.contar(de as { estado: EstadoKey }[]),
          total: de.length,
        };
      })
      .filter(Boolean);

    return {
      generadoEn: new Date().toISOString(),
      filtros: params,
      resumen: {
        indiceGlobal: this.indice(
          evaluados.map((k) => ({
            cumplimiento: k.cumplimiento,
            ponderacion: k.ponderacion,
          })),
          reglas.agregacionObjetivo,
        ),
        ...this.contar(evaluados as { estado: EstadoKey }[]),
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
