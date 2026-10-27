import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { CumplimientoService } from '../cumplimiento/cumplimiento.service.js';
import { AccesoService, type UsuarioSesion } from '../comun/acceso.service.js';
import {
  CreateIndicadorDto,
  UpdateIndicadorDto,
} from './indicadores.dto.js';

const UNIDAD_POR_TIPO: Record<string, string> = {
  PORCENTAJE: '%',
  SOLES: 'S/',
  PUNTOS: 'puntos',
  DIAS: 'días',
  SEMANAS: 'semanas',
  HORAS: 'horas',
  NUMERO_ORDEN: '#',
};

function inferirUnidadMedida(unidad?: string): string | undefined {
  if (!unidad) return undefined;
  const valor = unidad.trim().toLowerCase();
  if (valor === '%' || valor.includes('porcent')) return 'PORCENTAJE';
  if (valor.includes('s/') || valor.includes('sol')) return 'SOLES';
  if (valor.includes('día') || valor.includes('dia')) return 'DIAS';
  if (valor.includes('semana')) return 'SEMANAS';
  if (valor.includes('hora') || valor === 'h' || valor === 'hrs') return 'HORAS';
  if (valor === '#' || valor.includes('orden') || valor.includes('unidad')) {
    return 'NUMERO_ORDEN';
  }
  if (valor.includes('punto') || valor.includes('pt')) return 'PUNTOS';
  return undefined;
}

@Injectable()
export class IndicadoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly cumplimiento: CumplimientoService,
    private readonly acceso: AccesoService,
  ) {}

  async diccionario(
    perspectivaId?: string,
    periodoId?: string,
    empresaId?: string,
  ) {
    const [kpis, config] = await Promise.all([
      this.prisma.kpi.findMany({
        where: {
          ...(perspectivaId ? { perspectivaId } : {}),
          ...(empresaId ? { empresaId } : {}),
          activo: true,
        },
        include: {
          perspectiva: true,
          objetivoRef: { include: { perspectiva: true } },
          responsable: { select: { id: true, nombre: true, email: true } },
          asignaciones: {
            include: { usuario: { select: { id: true, nombre: true } } },
          },
          ...(periodoId ? { mediciones: { where: { periodoId } } } : {}),
        },
        orderBy: [{ perspectivaId: 'asc' }, { orden: 'asc' }],
      }),
      this.cumplimiento.reglas(empresaId),
    ]);
    return kpis.map((k) => {
      const med = (k as { mediciones?: { meta: unknown; real: unknown }[] })
        .mediciones?.[0];
      const evaluado = this.cumplimiento.evaluar(k, config, med ?? null);
      const { mediciones: _m, ...base } = k as typeof k & {
        mediciones?: { meta: unknown; real: unknown }[];
      };
      return {
        ...base,
        meta: evaluado.meta,
        real: evaluado.real,
        cumplimiento: evaluado.mostrado,
        cumplimientoBruto: evaluado.bruto,
        porcentaje: evaluado.porcentaje,
        estado: evaluado.estado,
        estadoKey: evaluado.estadoKey,
        formulaCalculo: evaluado.formula,
        valido: evaluado.valido,
        decimales: k.decimales ?? config.decimalesReporte ?? 2,
        umbralCumplido: k.umbralCumplido || config.umbralCumplido || 90,
        umbralAlerta: k.umbralAlerta || config.umbralAlerta || 75,
      };
    });
  }

  async agrupados(empresaId?: string, periodoId?: string) {
    const kpis = await this.diccionario(undefined, periodoId, empresaId);
    const objetivos = await this.prisma.objetivo.findMany({
      where: { ...(empresaId ? { empresaId } : {}), activo: true },
      include: { perspectiva: true },
      orderBy: [{ perspectivaId: 'asc' }, { orden: 'asc' }],
    });
    return objetivos.map((objetivo) => ({
      objetivo,
      kpis: kpis.filter((k) => k.objetivoId === objetivo.id),
    }));
  }

  async obtener(id: string) {
    const kpi = await this.prisma.kpi.findUnique({
      where: { id },
      include: {
        perspectiva: true,
        objetivoRef: { include: { perspectiva: true } },
        responsable: { select: { id: true, nombre: true, email: true } },
        asignaciones: {
          include: { usuario: { select: { id: true, nombre: true } } },
        },
      },
    });
    if (!kpi) throw new NotFoundException('Indicador no encontrado');
    return kpi;
  }

  private async validarObjetivo(objetivoId: string, empresaId: string) {
    const objetivo = await this.prisma.objetivo.findFirst({
      where: { id: objetivoId, empresaId, activo: true },
    });
    if (!objetivo) {
      throw new BadRequestException(
        'El KPI debe asociarse a un objetivo válido de la empresa',
      );
    }
    return objetivo;
  }

  private async validarResponsable(responsableId?: string) {
    if (!responsableId) return;
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: responsableId },
    });
    if (!usuario || !usuario.activo) {
      throw new BadRequestException('Responsable inexistente o inactivo');
    }
  }

  async crear(
    dto: CreateIndicadorDto,
    usuarioId?: string,
    empresaId = 'techperu',
  ) {
    const existe = await this.prisma.kpi.findUnique({ where: { id: dto.id } });
    if (existe) throw new BadRequestException('El código de indicador ya existe');
    const perspectiva = await this.prisma.perspectiva.findUnique({
      where: { id: dto.perspectivaId },
    });
    if (!perspectiva) throw new BadRequestException('Perspectiva inexistente');
    const objetivo = await this.validarObjetivo(dto.objetivoId, empresaId);
    await this.validarResponsable(dto.responsableId);

    const codigo = dto.codigo?.trim() || dto.id;
    const codigoExiste = await this.prisma.kpi.findUnique({
      where: { codigo },
    });
    if (codigoExiste) throw new BadRequestException('El código de KPI ya existe');

    const unidadMedida =
      dto.unidadMedida ?? inferirUnidadMedida(dto.unidad);
    const unidad = dto.unidad ?? (unidadMedida ? UNIDAD_POR_TIPO[unidadMedida] : '');

    const kpi = await this.prisma.kpi.create({
      data: {
        id: dto.id,
        codigo,
        empresaId,
        perspectivaId: dto.perspectivaId,
        objetivoId: dto.objetivoId,
        objetivo: dto.objetivo ?? `${objetivo.codigo}: ${objetivo.nombre}`,
        nombre: dto.nombre,
        unidad,
        unidadMedida: unidadMedida as never,
        meta: dto.meta,
        real: dto.real,
        inverso: dto.inverso ?? false,
        tipo: (dto.tipo ?? (dto.inverso ? 'MENOR_MEJOR' : 'MAYOR_MEJOR')) as never,
        frecuencia: (dto.frecuencia ?? 'TRIMESTRAL') as never,
        formula: dto.formula ?? '',
        fuenteDatos: dto.fuenteDatos ?? '',
        responsableValidacion: dto.responsableValidacion ?? '',
        responsableId: dto.responsableId || null,
        umbralCumplido: dto.umbralCumplido ?? 90,
        umbralAlerta: dto.umbralAlerta ?? 75,
        rangoMin: dto.rangoMin,
        rangoMax: dto.rangoMax,
        decimales: dto.decimales,
        agregacionPeriodos: dto.agregacionPeriodos ?? 'ULTIMO',
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
      detalle: { nombre: dto.nombre, objetivoId: dto.objetivoId },
    });
    return kpi;
  }

  async actualizar(id: string, dto: UpdateIndicadorDto, usuario?: UsuarioSesion) {
    const actual = await this.obtener(id);
    if (!(await this.acceso.puedeEditarKpi(usuario, id))) {
      throw new ForbiddenException('No puede modificar este KPI');
    }
    if (dto.perspectivaId) {
      const perspectiva = await this.prisma.perspectiva.findUnique({
        where: { id: dto.perspectivaId },
      });
      if (!perspectiva) throw new BadRequestException('Perspectiva inexistente');
    }
    if (dto.objetivoId && dto.objetivoId !== actual.objetivoId) {
      await this.validarObjetivo(dto.objetivoId, actual.empresaId);
    }
    await this.validarResponsable(dto.responsableId);
    if (dto.codigo && dto.codigo !== actual.codigo) {
      const existe = await this.prisma.kpi.findUnique({
        where: { codigo: dto.codigo },
      });
      if (existe) throw new BadRequestException('El código de KPI ya existe');
    }

    const data: Record<string, unknown> = {};
    if (dto.codigo !== undefined) data.codigo = dto.codigo;
    if (dto.perspectivaId) data.perspectivaId = dto.perspectivaId;
    if (dto.objetivoId !== undefined) data.objetivoId = dto.objetivoId;
    if (dto.objetivo) data.objetivo = dto.objetivo;
    if (dto.nombre) data.nombre = dto.nombre;
    if (dto.unidad) data.unidad = dto.unidad;
    if (dto.unidadMedida) data.unidadMedida = dto.unidadMedida;
    if (dto.meta !== undefined) data.meta = dto.meta;
    if (dto.real !== undefined) data.real = dto.real;
    if (dto.inverso !== undefined) data.inverso = dto.inverso;
    if (dto.tipo) data.tipo = dto.tipo;
    if (dto.frecuencia) data.frecuencia = dto.frecuencia;
    if (dto.formula !== undefined) data.formula = dto.formula;
    if (dto.fuenteDatos !== undefined) data.fuenteDatos = dto.fuenteDatos;
    if (dto.responsableValidacion !== undefined) {
      data.responsableValidacion = dto.responsableValidacion;
    }
    if (dto.responsableId !== undefined) {
      data.responsableId = dto.responsableId || null;
    }
    if (dto.umbralCumplido !== undefined) data.umbralCumplido = dto.umbralCumplido;
    if (dto.umbralAlerta !== undefined) data.umbralAlerta = dto.umbralAlerta;
    if (dto.rangoMin !== undefined) data.rangoMin = dto.rangoMin;
    if (dto.rangoMax !== undefined) data.rangoMax = dto.rangoMax;
    if (dto.decimales !== undefined) data.decimales = dto.decimales;
    if (dto.agregacionPeriodos !== undefined) {
      data.agregacionPeriodos = dto.agregacionPeriodos;
    }
    if (dto.accion !== undefined) data.accion = dto.accion;
    if (dto.orden !== undefined) data.orden = dto.orden;
    if (dto.ponderacion !== undefined) data.ponderacion = dto.ponderacion;
    if (dto.activo !== undefined) data.activo = dto.activo;

    const kpi = await this.prisma.kpi.update({
      where: { id },
      data: data as never,
    });
    await this.auditoria.registrar({
      usuarioId: usuario?.id,
      accion: 'ACTUALIZAR',
      entidad: 'Kpi',
      entidadId: id,
      detalle: dto as Record<string, unknown>,
    });
    return kpi;
  }

  async desactivar(id: string, usuario?: UsuarioSesion) {
    await this.obtener(id);
    if (!(await this.acceso.puedeEditarKpi(usuario, id))) {
      throw new ForbiddenException('No puede desactivar este KPI');
    }
    const kpi = await this.prisma.kpi.update({
      where: { id },
      data: { activo: false },
    });
    await this.auditoria.registrar({
      usuarioId: usuario?.id,
      accion: 'DESACTIVAR',
      entidad: 'Kpi',
      entidadId: id,
    });
    return kpi;
  }

  async asignarEquipo(
    kpiId: string,
    usuarioIds: string[],
    usuario?: UsuarioSesion,
  ) {
    await this.obtener(kpiId);
    if (!(await this.acceso.puedeEditarKpi(usuario, kpiId))) {
      throw new ForbiddenException('No puede asignar el equipo de este KPI');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.asignacion.deleteMany({ where: { kpiId } });
      for (const id of [...new Set(usuarioIds)]) {
        const usuario = await tx.usuario.findUnique({ where: { id } });
        if (!usuario || !usuario.activo) {
          throw new BadRequestException(`Usuario ${id} inexistente o inactivo`);
        }
        await tx.asignacion.create({ data: { kpiId, usuarioId: id } });
      }
    });
    await this.auditoria.registrar({
      usuarioId: usuario?.id,
      accion: 'ACTUALIZAR',
      entidad: 'Kpi',
      entidadId: kpiId,
      detalle: { equipo: usuarioIds },
    });
    return this.obtener(kpiId);
  }
}
