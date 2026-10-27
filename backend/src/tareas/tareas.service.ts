import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { AccesoService, type UsuarioSesion } from '../comun/acceso.service.js';
import {
  CreateResultadoTareaDto,
  CreateTareaDto,
  UpdateTareaDto,
  ValidarResultadoTareaDto,
} from './tareas.dto.js';

@Injectable()
export class TareasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly acceso: AccesoService,
  ) {}

  private include = {
    objetivo: {
      include: { perspectiva: true },
    },
    kpi: {
      select: {
        id: true,
        codigo: true,
        nombre: true,
        unidad: true,
        unidadMedida: true,
      },
    },
    responsable: { select: { id: true, nombre: true, email: true } },
    creador: { select: { id: true, nombre: true, email: true } },
    resultados: {
      include: {
        autor: { select: { id: true, nombre: true } },
        validadoPor: { select: { id: true, nombre: true } },
        evidencias: true,
      },
      orderBy: { fecha: 'desc' as const },
    },
    evidencias: true,
  };

  async listar(filtros: {
    objetivoId?: string;
    kpiId?: string;
    responsableId?: string;
    estado?: string;
    empresaId?: string;
  } = {}) {
    return this.prisma.tarea.findMany({
      where: {
        ...(filtros.objetivoId ? { objetivoId: filtros.objetivoId } : {}),
        ...(filtros.kpiId ? { kpiId: filtros.kpiId } : {}),
        ...(filtros.responsableId
          ? { responsableId: filtros.responsableId }
          : {}),
        ...(filtros.estado ? { estado: filtros.estado as never } : {}),
        ...(filtros.empresaId
          ? { objetivo: { empresaId: filtros.empresaId } }
          : {}),
      },
      include: this.include,
      orderBy: [{ estado: 'asc' }, { fechaFin: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async obtener(id: string) {
    const tarea = await this.prisma.tarea.findUnique({
      where: { id },
      include: this.include,
    });
    if (!tarea) throw new NotFoundException('Tarea no encontrada');
    return tarea;
  }

  private async validarRelaciones(
    objetivoId: string,
    kpiId?: string,
    responsableId?: string,
    empresaId?: string,
  ) {
    const objetivo = await this.prisma.objetivo.findFirst({
      where: {
        id: objetivoId,
        ...(empresaId ? { empresaId } : {}),
      },
      select: { id: true, responsableId: true, empresaId: true },
    });
    if (!objetivo) {
      throw new BadRequestException('El objetivo asociado no existe');
    }
    if (kpiId) {
      const kpi = await this.prisma.kpi.findUnique({
        where: { id: kpiId },
        select: { objetivoId: true },
      });
      if (!kpi) throw new BadRequestException('El KPI asociado no existe');
      if (kpi.objetivoId !== objetivoId) {
        throw new BadRequestException('El KPI no pertenece al objetivo indicado');
      }
    }
    if (responsableId) {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: responsableId },
      });
      if (!usuario || !usuario.activo) {
        throw new BadRequestException('Responsable inexistente o inactivo');
      }
    }
    return objetivo;
  }

  private async puedeCrear(
    usuario: UsuarioSesion,
    objetivo: { id: string; responsableId: string | null },
    kpiId?: string,
  ): Promise<boolean> {
    if (this.acceso.esGestorGlobal(usuario)) return true;
    if (objetivo.responsableId === usuario.id) return true;
    if (kpiId && (await this.acceso.puedeEditarKpi(usuario, kpiId))) return true;
    if (usuario.rol === 'ANALISTA' && kpiId) {
      const asignacion = await this.prisma.asignacion.findUnique({
        where: { usuarioId_kpiId: { usuarioId: usuario.id, kpiId } },
      });
      return Boolean(asignacion);
    }
    return false;
  }

  private async puedeGestionar(
    usuario: UsuarioSesion,
    tarea: {
      creadorId: string;
      responsableId: string | null;
      objetivoId: string;
      kpiId?: string | null;
    },
  ): Promise<boolean> {
    if (this.acceso.esGestorGlobal(usuario)) return true;
    if (tarea.creadorId === usuario.id || tarea.responsableId === usuario.id) {
      return true;
    }
    if (await this.acceso.puedeEditarObjetivoPorId(usuario, tarea.objetivoId)) {
      return true;
    }
    if (tarea.kpiId && (await this.acceso.puedeEditarKpi(usuario, tarea.kpiId))) {
      return true;
    }
    return false;
  }

  async crear(dto: CreateTareaDto, usuario: UsuarioSesion) {
    const objetivo = await this.validarRelaciones(
      dto.objetivoId,
      dto.kpiId,
      dto.responsableId,
    );
    if (!(await this.puedeCrear(usuario, objetivo, dto.kpiId))) {
      throw new ForbiddenException(
        'No tiene permisos para crear tareas en este objetivo/KPI',
      );
    }
    const tarea = await this.prisma.tarea.create({
      data: {
        titulo: dto.titulo,
        descripcion: dto.descripcion ?? '',
        objetivoId: dto.objetivoId,
        kpiId: dto.kpiId || null,
        responsableId: dto.responsableId || null,
        creadorId: usuario.id,
        fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : new Date(),
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
        estado: (dto.estado ?? 'PENDIENTE') as never,
        avance: dto.avance ?? 0,
      },
    });
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'CREAR',
      entidad: 'Tarea',
      entidadId: tarea.id,
      detalle: { objetivoId: dto.objetivoId, kpiId: dto.kpiId },
    });
    return this.obtener(tarea.id);
  }

  async actualizar(
    id: string,
    dto: UpdateTareaDto,
    usuario: UsuarioSesion,
  ) {
    const actual = await this.obtener(id);
    if (!(await this.puedeGestionar(usuario, actual))) {
      throw new ForbiddenException('No tiene permisos para modificar esta tarea');
    }
    const objetivoId = dto.objetivoId ?? actual.objetivoId;
    const kpiId = dto.kpiId === undefined ? actual.kpiId ?? undefined : dto.kpiId;
    await this.validarRelaciones(
      objetivoId,
      kpiId,
      dto.responsableId,
      actual.objetivo.empresaId,
    );
    const tarea = await this.prisma.tarea.update({
      where: { id },
      data: {
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        objetivoId: dto.objetivoId,
        kpiId: dto.kpiId === undefined ? undefined : dto.kpiId || null,
        responsableId:
          dto.responsableId === undefined
            ? undefined
            : dto.responsableId || null,
        fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : undefined,
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
        estado: dto.estado as never,
        avance: dto.avance,
      },
    });
    if (
      dto.estado === 'COMPLETADA' &&
      actual.estado !== 'COMPLETADA' &&
      (dto.avance === undefined || dto.avance < 100)
    ) {
      await this.prisma.tarea.update({
        where: { id },
        data: { avance: 100 },
      });
    }
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'ACTUALIZAR',
      entidad: 'Tarea',
      entidadId: id,
      detalle: dto as Record<string, unknown>,
    });
    return this.obtener(tarea.id);
  }

  async eliminar(id: string, usuario: UsuarioSesion) {
    const actual = await this.obtener(id);
    if (!(await this.puedeGestionar(usuario, actual))) {
      throw new ForbiddenException('No tiene permisos para eliminar esta tarea');
    }
    await this.prisma.tarea.delete({ where: { id } });
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'ELIMINAR',
      entidad: 'Tarea',
      entidadId: id,
    });
    return { eliminado: true };
  }

  async listarResultados(tareaId: string) {
    await this.obtener(tareaId);
    return this.prisma.resultadoTarea.findMany({
      where: { tareaId },
      include: {
        autor: { select: { id: true, nombre: true } },
        validadoPor: { select: { id: true, nombre: true } },
        evidencias: true,
      },
      orderBy: { fecha: 'desc' },
    });
  }

  async crearResultado(
    tareaId: string,
    dto: CreateResultadoTareaDto,
    usuario: UsuarioSesion,
  ) {
    const tarea = await this.obtener(tareaId);
    if (!(await this.puedeGestionar(usuario, tarea))) {
      throw new ForbiddenException(
        'No tiene permisos para registrar resultados en esta tarea',
      );
    }
    const resultado = await this.prisma.$transaction(async (tx) => {
      const creado = await tx.resultadoTarea.create({
        data: {
          tareaId,
          descripcion: dto.descripcion,
          valor: dto.valor,
          autorId: usuario.id,
          fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        },
      });
      if (dto.evidenciaIds?.length) {
        await tx.evidencia.updateMany({
          where: { id: { in: dto.evidenciaIds } },
          data: { resultadoTareaId: creado.id, tareaId },
        });
      }
      return creado;
    });
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'CREAR',
      entidad: 'ResultadoTarea',
      entidadId: resultado.id,
      detalle: { tareaId },
    });
    return this.prisma.resultadoTarea.findUnique({
      where: { id: resultado.id },
      include: { autor: true, evidencias: true },
    });
  }

  private async reglaResultados(empresaId: string) {
    const config = await this.prisma.config.findFirst({
      where: { OR: [{ empresaId }, { id: 'global' }] },
      orderBy: [{ empresaId: 'desc' }],
    });
    return config?.agregacionResultados ?? 'NINGUNA';
  }

  async validarResultado(
    resultadoId: string,
    dto: ValidarResultadoTareaDto,
    usuario: UsuarioSesion,
  ) {
    const resultado = await this.prisma.resultadoTarea.findUnique({
      where: { id: resultadoId },
      include: { tarea: true },
    });
    if (!resultado) throw new NotFoundException('Resultado no encontrado');
    if (!(await this.puedeGestionar(usuario, resultado.tarea))) {
      throw new ForbiddenException('No tiene permisos para validar este resultado');
    }
    if (dto.estadoValidacion === 'VALIDADO' && dto.periodoId) {
      const periodo = await this.prisma.periodo.findUnique({
        where: { id: dto.periodoId },
      });
      if (!periodo) throw new BadRequestException('Periodo inexistente');
    }

    let kpiActualizado: string | null = null;
    const actualizado = await this.prisma.$transaction(async (tx) => {
      let aplicado = false;
      if (
        dto.estadoValidacion === 'VALIDADO' &&
        resultado.tarea.kpiId &&
        resultado.valor != null
      ) {
        if (resultado.aplicadoKpi) {
          throw new BadRequestException(
            'El resultado ya fue aplicado al KPI; no puede contabilizarse dos veces',
          );
        }
        const tarea = await tx.tarea.findUnique({
          where: { id: resultado.tareaId },
          include: { objetivo: { select: { empresaId: true } } },
        });
        const kpi = await tx.kpi.findUnique({
          where: { id: resultado.tarea.kpiId },
        });
        if (!tarea || !kpi) {
          throw new BadRequestException('KPI asociado inexistente');
        }
        const regla = await this.reglaResultados(tarea.objetivo.empresaId);
        if (regla === 'NINGUNA') {
          throw new BadRequestException(
            'La configuración no define una regla de agregación de resultados hacia el KPI',
          );
        }
        const valor = dto.valorAplicado ?? Number(resultado.valor);
        const actual = Number(kpi.real);
        let nuevoReal = actual;
        if (regla === 'SUMA') nuevoReal = actual + valor;
        else if (regla === 'ULTIMO') nuevoReal = valor;
        else if (regla === 'PROMEDIO') nuevoReal = (actual + valor) / 2;
        nuevoReal = Math.round(nuevoReal * 10000) / 10000;

        const marcado = await tx.resultadoTarea.updateMany({
          where: { id: resultadoId, aplicadoKpi: false },
          data: { aplicadoKpi: true },
        });
        if (marcado.count === 0) {
          throw new BadRequestException(
            'El resultado ya fue aplicado al KPI; no puede contabilizarse dos veces',
          );
        }

        await tx.kpi.update({
          where: { id: kpi.id },
          data: { real: nuevoReal },
        });
        const periodo = dto.periodoId
          ? await tx.periodo.findUnique({ where: { id: dto.periodoId } })
          : await tx.periodo.findFirst({
              where: { empresaId: kpi.empresaId, activo: true },
            });
        if (periodo) {
          await tx.medicion.upsert({
            where: {
              kpiId_periodoId: { kpiId: kpi.id, periodoId: periodo.id },
            },
            update: { meta: kpi.meta, real: nuevoReal },
            create: {
              kpiId: kpi.id,
              periodoId: periodo.id,
              meta: kpi.meta,
              real: nuevoReal,
              registradoPorId: usuario.id,
            },
          });
        }
        aplicado = true;
        kpiActualizado = kpi.id;
      }

      return tx.resultadoTarea.update({
        where: { id: resultadoId },
        data: {
          estadoValidacion: dto.estadoValidacion as never,
          validadoPorId: usuario.id,
          validadoEn: new Date(),
          ...(aplicado ? { aplicadoKpi: true } : {}),
        },
        include: {
          autor: { select: { id: true, nombre: true } },
          validadoPor: { select: { id: true, nombre: true } },
          evidencias: true,
        },
      });
    });

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: dto.estadoValidacion,
      entidad: 'ResultadoTarea',
      entidadId: resultadoId,
      detalle: { kpiId: kpiActualizado, periodoId: dto.periodoId ?? null },
    });
    return actualizado;
  }
}
