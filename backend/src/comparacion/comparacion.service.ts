import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ComparacionService {
  constructor(private readonly prisma: PrismaService) {}

  private calcular(meta: number, real: number, inverso: boolean) {
    if (real === 0) return 0;
    const pct = inverso ? (meta / real) * 100 : (real / meta) * 100;
    return Math.round(pct * 10) / 10;
  }

  /**
   * Compara el cumplimiento por perspectiva y KPI entre dos períodos (RF-19).
   */
  async comparar(
    periodoAId: string,
    periodoBId: string,
    empresaId?: string,
  ) {
    const [periodoA, periodoB, kpis] = await Promise.all([
      this.prisma.periodo.findUnique({ where: { id: periodoAId } }),
      this.prisma.periodo.findUnique({ where: { id: periodoBId } }),
      this.prisma.kpi.findMany({
        where: { activo: true, ...(empresaId ? { empresaId } : {}) },
        include: {
          perspectiva: true,
          mediciones: { where: { periodoId: { in: [periodoAId, periodoBId] } } },
        },
        orderBy: [{ perspectivaId: 'asc' }, { orden: 'asc' }],
      }),
    ]);

    if (
      empresaId &&
      (periodoA?.empresaId === empresaId || periodoB?.empresaId === empresaId)
    ) {
      if (periodoA?.empresaId !== empresaId || periodoB?.empresaId !== empresaId) {
        throw new BadRequestException(
          'Los períodos deben pertenecer a la misma empresa',
        );
      }
    }

    const filas = kpis.map((k) => {
      const medA = k.mediciones.find((m) => m.periodoId === periodoAId);
      const medB = k.mediciones.find((m) => m.periodoId === periodoBId);
      const cumA = this.calcular(
        medA?.meta ?? k.meta,
        medA?.real ?? k.real,
        k.inverso,
      );
      const cumB = this.calcular(
        medB?.meta ?? k.meta,
        medB?.real ?? k.real,
        k.inverso,
      );
      return {
        id: k.id,
        nombre: k.nombre,
        perspectivaId: k.perspectivaId,
        perspectiva: k.perspectiva.nombre,
        cumplimientoA: cumA,
        cumplimientoB: cumB,
        variacion: Math.round((cumB - cumA) * 10) / 10,
        tendencia:
          cumB > cumA ? 'mejora' : cumB < cumA ? 'deterioro' : 'estable',
      };
    });

    const porPerspectiva = Object.values(
      filas.reduce<
        Record<
          string,
          {
            perspectivaId: string;
            perspectiva: string;
            cumplimientoA: number;
            cumplimientoB: number;
            variacion: number;
            kpis: number;
          }
        >
      >((acc, f) => {
        const key = f.perspectivaId;
        acc[key] ??= {
          perspectivaId: f.perspectivaId,
          perspectiva: f.perspectiva,
          cumplimientoA: 0,
          cumplimientoB: 0,
          variacion: 0,
          kpis: 0,
        };
        acc[key].cumplimientoA += f.cumplimientoA;
        acc[key].cumplimientoB += f.cumplimientoB;
        acc[key].kpis += 1;
        return acc;
      }, {}),
    ).map((p) => ({
      ...p,
      cumplimientoA: Math.round((p.cumplimientoA / p.kpis) * 10) / 10,
      cumplimientoB: Math.round((p.cumplimientoB / p.kpis) * 10) / 10,
      variacion:
        Math.round((p.cumplimientoB - p.cumplimientoA) * 10) / 10,
    }));

    return {
      periodoA: periodoA ? { id: periodoA.id, nombre: periodoA.nombre } : null,
      periodoB: periodoB ? { id: periodoB.id, nombre: periodoB.nombre } : null,
      porPerspectiva,
      kpis: filas,
    };
  }
}
