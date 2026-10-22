import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import {
  CreateIndicadorDto,
  UpdateIndicadorDto,
} from './indicadores.dto.js';

@Injectable()
export class IndicadoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  private calcularCumplimiento(
    meta: number,
    real: number,
    inverso: boolean,
  ): number {
    if (real === 0) return 0;
    const pct = inverso ? (meta / real) * 100 : (real / meta) * 100;
    return Math.round(pct * 10) / 10;
  }

  private clasificar(
    pct: number,
    umbralCumplido: number,
    umbralAlerta: number,
  ) {
    if (pct >= umbralCumplido) return 'logrado';
    if (pct >= umbralAlerta) return 'riesgo';
    return 'critico';
  }

  async diccionario(perspectivaId?: string, periodoId?: string) {
    const kpis = await this.prisma.kpi.findMany({
      where: {
        ...(perspectivaId ? { perspectivaId } : {}),
        activo: true,
      },
      include: {
        perspectiva: true,
        objetivoRef: true,
        ...(periodoId
          ? { mediciones: { where: { periodoId } } }
          : {}),
      },
      orderBy: [{ perspectivaId: 'asc' }, { orden: 'asc' }],
    });
    const config = await this.prisma.config.findUnique({
      where: { id: 'global' },
    });
    return kpis.map((k) => {
      const med = (k as { mediciones?: { meta: number; real: number }[] })
        .mediciones?.[0];
      const meta = med?.meta ?? k.meta;
      const real = med?.real ?? k.real;
      const cumplimiento = this.calcularCumplimiento(meta, real, k.inverso);
      const ucum = k.umbralCumplido || config?.umbralCumplido || 90;
      const ual = k.umbralAlerta || config?.umbralAlerta || 75;
      const { mediciones: _m, ...base } = k as Record<string, unknown>;
      return {
        ...base,
        meta,
        real,
        cumplimiento,
        estado: this.clasificar(cumplimiento, ucum, ual),
      };
    });
  }

  async obtener(id: string) {
    const kpi = await this.prisma.kpi.findUnique({
      where: { id },
      include: { perspectiva: true, objetivoRef: true },
    });
    if (!kpi) throw new NotFoundException('Indicador no encontrado');
    return kpi;
  }

  async crear(dto: CreateIndicadorDto, usuarioId?: string) {
    const existe = await this.prisma.kpi.findUnique({ where: { id: dto.id } });
    if (existe) throw new BadRequestException('El código de indicador ya existe');
    const perspectiva = await this.prisma.perspectiva.findUnique({
      where: { id: dto.perspectivaId },
    });
    if (!perspectiva) throw new BadRequestException('Perspectiva inexistente');

    const kpi = await this.prisma.kpi.create({
      data: {
        id: dto.id,
        perspectivaId: dto.perspectivaId,
        objetivoId: dto.objetivoId,
        objetivo: dto.objetivo,
        nombre: dto.nombre,
        unidad: dto.unidad,
        meta: dto.meta,
        real: dto.real,
        inverso: dto.inverso ?? false,
        tipo: (dto.tipo ?? (dto.inverso ? 'MENOR_MEJOR' : 'MAYOR_MEJOR')) as never,
        frecuencia: (dto.frecuencia ?? 'TRIMESTRAL') as never,
        formula: dto.formula ?? '',
        fuenteDatos: dto.fuenteDatos ?? '',
        responsableValidacion: dto.responsableValidacion ?? '',
        umbralCumplido: dto.umbralCumplido ?? 90,
        umbralAlerta: dto.umbralAlerta ?? 75,
        rangoMin: dto.rangoMin,
        rangoMax: dto.rangoMax,
        accion: dto.accion ?? '',
        orden: dto.orden ?? 0,
        ponderacion: dto.ponderacion ?? 0,
      },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'CREAR',
      entidad: 'Kpi',
      entidadId: kpi.id,
      detalle: { nombre: dto.nombre },
    });
    return kpi;
  }

  async actualizar(id: string, dto: UpdateIndicadorDto, usuarioId?: string) {
    await this.obtener(id);
    const data: Record<string, unknown> = {};
    if (dto.perspectivaId) data.perspectivaId = dto.perspectivaId;
    if (dto.objetivoId !== undefined) data.objetivoId = dto.objetivoId;
    if (dto.objetivo) data.objetivo = dto.objetivo;
    if (dto.nombre) data.nombre = dto.nombre;
    if (dto.unidad) data.unidad = dto.unidad;
    if (dto.meta !== undefined) data.meta = dto.meta;
    if (dto.real !== undefined) data.real = dto.real;
    if (dto.inverso !== undefined) data.inverso = dto.inverso;
    if (dto.tipo) data.tipo = dto.tipo;
    if (dto.frecuencia) data.frecuencia = dto.frecuencia;
    if (dto.formula !== undefined) data.formula = dto.formula;
    if (dto.fuenteDatos !== undefined) data.fuenteDatos = dto.fuenteDatos;
    if (dto.responsableValidacion !== undefined) data.responsableValidacion = dto.responsableValidacion;
    if (dto.umbralCumplido !== undefined) data.umbralCumplido = dto.umbralCumplido;
    if (dto.umbralAlerta !== undefined) data.umbralAlerta = dto.umbralAlerta;
    if (dto.rangoMin !== undefined) data.rangoMin = dto.rangoMin;
    if (dto.rangoMax !== undefined) data.rangoMax = dto.rangoMax;
    if (dto.accion !== undefined) data.accion = dto.accion;
    if (dto.orden !== undefined) data.orden = dto.orden;
    if (dto.ponderacion !== undefined) data.ponderacion = dto.ponderacion;
    if (dto.activo !== undefined) data.activo = dto.activo;

    const kpi = await this.prisma.kpi.update({ where: { id }, data: data as never });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'ACTUALIZAR',
      entidad: 'Kpi',
      entidadId: id,
      detalle: dto as Record<string, unknown>,
    });
    return kpi;
  }

  async desactivar(id: string, usuarioId?: string) {
    await this.obtener(id);
    const kpi = await this.prisma.kpi.update({
      where: { id },
      data: { activo: false },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'DESACTIVAR',
      entidad: 'Kpi',
      entidadId: id,
    });
    return kpi;
  }
}
