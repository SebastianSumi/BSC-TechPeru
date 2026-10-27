import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  agregarCumplimientos,
  calcularCumplimiento,
  type ReglasConfig,
  type ResultadoCumplimiento,
} from './cumplimiento.logic.js';

export interface KpiEvaluable {
  tipo?: string | null;
  inverso?: boolean | null;
  meta: unknown;
  real: unknown;
  rangoMin?: unknown;
  rangoMax?: unknown;
  umbralCumplido?: number | null;
  umbralAlerta?: number | null;
  decimales?: number | null;
}

export interface ReglasEmpresa extends ReglasConfig {
  agregacionObjetivo: string;
  agregacionPeriodos: string;
}

@Injectable()
export class CumplimientoService {
  constructor(private readonly prisma: PrismaService) {}

  async reglas(empresaId?: string): Promise<ReglasEmpresa> {
    const config = empresaId
      ? await this.prisma.config.findFirst({
          where: { OR: [{ empresaId }, { id: 'global' }] },
          orderBy: [{ empresaId: 'desc' }],
        })
      : await this.prisma.config.findUnique({ where: { id: 'global' } });
    return {
      umbralCumplido: config?.umbralCumplido ?? 90,
      umbralAlerta: config?.umbralAlerta ?? 75,
      decimalesReporte: config?.decimalesReporte ?? 2,
      formatoPorcentaje: config?.formatoPorcentaje ?? 'DECIMAL',
      limitarPorcentaje: config?.limitarPorcentaje ?? false,
      agregacionObjetivo: config?.agregacionObjetivo ?? 'PROMEDIO',
      agregacionPeriodos: config?.agregacionPeriodos ?? 'ULTIMO',
    };
  }

  evaluar(
    kpi: KpiEvaluable,
    reglas?: ReglasConfig | null,
    medicion?: { meta: unknown; real: unknown } | null,
  ): ResultadoCumplimiento {
    return calcularCumplimiento(
      {
        tipo: kpi.tipo,
        inverso: kpi.inverso,
        meta: Number(medicion?.meta ?? kpi.meta),
        real: Number(medicion?.real ?? kpi.real),
        rangoMin: kpi.rangoMin == null ? null : Number(kpi.rangoMin),
        rangoMax: kpi.rangoMax == null ? null : Number(kpi.rangoMax),
        umbralCumplido: kpi.umbralCumplido,
        umbralAlerta: kpi.umbralAlerta,
        decimales: kpi.decimales,
      },
      reglas,
    );
  }

  agregarObjetivo(
    filas: { cumplimiento: number; ponderacion?: number | null }[],
    regla?: string | null,
  ): number {
    return agregarCumplimientos(filas, regla);
  }
}
