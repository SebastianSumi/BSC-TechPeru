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
  CreateRecomendacionDto,
  UpdateRecomendacionDto,
} from './recomendaciones.dto.js';

@Injectable()
export class RecomendacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly acceso: AccesoService,
  ) {}

  private include = {
    autor: { select: { id: true, nombre: true, email: true } },
    objetivo: { select: { id: true, codigo: true, nombre: true } },
    kpi: { select: { id: true, nombre: true } },
  };

  async listar(filtros: {
    objetivoId?: string;
    kpiId?: string;
    empresaId?: string;
    soloFijadas?: boolean;
  } = {}) {
    return this.prisma.recomendacion.findMany({
      where: {
        ...(filtros.objetivoId ? { objetivoId: filtros.objetivoId } : {}),
        ...(filtros.kpiId ? { kpiId: filtros.kpiId } : {}),
        ...(filtros.soloFijadas ? { fijada: true } : {}),
        ...(filtros.empresaId
          ? {
              OR: [
                { objetivo: { empresaId: filtros.empresaId } },
                { kpi: { empresaId: filtros.empresaId } },
              ],
            }
          : {}),
      },
      include: this.include,
      orderBy: [{ fijada: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async obtener(id: string) {
    const recomendacion = await this.prisma.recomendacion.findUnique({
      where: { id },
      include: this.include,
    });
    if (!recomendacion) throw new NotFoundException('Recomendación no encontrada');
    return recomendacion;
  }

  private async validarDestino(objetivoId?: string, kpiId?: string) {
    if (!objetivoId && !kpiId) {
      throw new BadRequestException(
        'La recomendación debe asociarse a un objetivo o a un KPI',
      );
    }
    if (objetivoId) {
      const objetivo = await this.prisma.objetivo.findUnique({
        where: { id: objetivoId },
      });
      if (!objetivo) throw new BadRequestException('Objetivo inexistente');
    }
    if (kpiId) {
      const kpi = await this.prisma.kpi.findUnique({ where: { id: kpiId } });
      if (!kpi) throw new BadRequestException('KPI inexistente');
      if (objetivoId && kpi.objetivoId !== objetivoId) {
        throw new BadRequestException('El KPI no pertenece al objetivo indicado');
      }
    }
  }

  private async autorizadoParaFijar(
    usuario: UsuarioSesion,
    objetivoId?: string | null,
    kpiId?: string | null,
  ): Promise<boolean> {
    if (this.acceso.esGestorGlobal(usuario)) return true;
    if (objetivoId && (await this.acceso.puedeEditarObjetivoPorId(usuario, objetivoId))) {
      return true;
    }
    if (kpiId && (await this.acceso.puedeEditarKpi(usuario, kpiId))) {
      return true;
    }
    return false;
  }

  private async fijarEnTransaccion(
    recomendacionId: string,
    objetivoId?: string | null,
    kpiId?: string | null,
  ) {
    const llave = `recomendacion:${objetivoId ?? ''}:${kpiId ?? ''}`;
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(
        'SELECT pg_advisory_xact_lock(hashtext($1))',
        llave,
      );
      if (objetivoId) {
        await tx.recomendacion.updateMany({
          where: {
            objetivoId,
            fijada: true,
            id: { not: recomendacionId },
          },
          data: { fijada: false },
        });
      }
      if (kpiId) {
        await tx.recomendacion.updateMany({
          where: {
            kpiId,
            fijada: true,
            id: { not: recomendacionId },
          },
          data: { fijada: false },
        });
      }
      await tx.recomendacion.update({
        where: { id: recomendacionId },
        data: { fijada: true },
      });
    });
  }

  async crear(
    dto: CreateRecomendacionDto,
    usuario: UsuarioSesion,
  ) {
    await this.validarDestino(dto.objetivoId, dto.kpiId);
    if (dto.fijada) {
      const permitido = await this.autorizadoParaFijar(
        usuario,
        dto.objetivoId,
        dto.kpiId,
      );
      if (!permitido) {
        throw new ForbiddenException(
          'Solo el responsable del objetivo/KPI o un usuario con permisos puede fijar recomendaciones',
        );
      }
    }
    const recomendacion = await this.prisma.recomendacion.create({
      data: {
        contenido: dto.contenido,
        autorId: usuario.id,
        objetivoId: dto.objetivoId || null,
        kpiId: dto.kpiId || null,
        fijada: false,
      },
    });
    if (dto.fijada) {
      await this.fijarEnTransaccion(
        recomendacion.id,
        dto.objetivoId,
        dto.kpiId,
      );
    }
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'CREAR',
      entidad: 'Recomendacion',
      entidadId: recomendacion.id,
      detalle: { objetivoId: dto.objetivoId, kpiId: dto.kpiId, fijada: dto.fijada },
    });
    return this.obtener(recomendacion.id);
  }

  async actualizar(
    id: string,
    dto: UpdateRecomendacionDto,
    usuario: UsuarioSesion,
  ) {
    const actual = await this.obtener(id);
    const esAutor = actual.autorId === usuario.id;
    const puede = this.acceso.esGestorGlobal(usuario) || esAutor;
    if (!puede) throw new ForbiddenException('No puede editar esta recomendación');
    if (dto.fijada) {
      const permitido = await this.autorizadoParaFijar(
        usuario,
        actual.objetivoId,
        actual.kpiId,
      );
      if (!permitido) {
        throw new ForbiddenException(
          'Solo el responsable del objetivo/KPI o un usuario con permisos puede fijar recomendaciones',
        );
      }
    }
    await this.prisma.recomendacion.update({
      where: { id },
      data: {
        ...(dto.contenido !== undefined ? { contenido: dto.contenido } : {}),
        ...(dto.fijada === false ? { fijada: false } : {}),
      },
    });
    if (dto.fijada === true) {
      await this.fijarEnTransaccion(id, actual.objetivoId, actual.kpiId);
    }
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'ACTUALIZAR',
      entidad: 'Recomendacion',
      entidadId: id,
      detalle: dto as Record<string, unknown>,
    });
    return this.obtener(id);
  }

  async fijar(id: string, fijada: boolean, usuario: UsuarioSesion) {
    const actual = await this.obtener(id);
    if (fijada) {
      const permitido = await this.autorizadoParaFijar(
        usuario,
        actual.objetivoId,
        actual.kpiId,
      );
      if (!permitido) {
        throw new ForbiddenException(
          'Solo el responsable del objetivo/KPI o un usuario con permisos puede fijar recomendaciones',
        );
      }
      await this.fijarEnTransaccion(id, actual.objetivoId, actual.kpiId);
    } else {
      await this.prisma.recomendacion.update({
        where: { id },
        data: { fijada: false },
      });
    }
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: fijada ? 'FIJAR' : 'DESFIJAR',
      entidad: 'Recomendacion',
      entidadId: id,
    });
    return this.obtener(id);
  }

  async eliminar(id: string, usuario: UsuarioSesion) {
    const actual = await this.obtener(id);
    const esAutor = actual.autorId === usuario.id;
    const esResponsable = await this.autorizadoParaFijar(
      usuario,
      actual.objetivoId,
      actual.kpiId,
    );
    if (!this.acceso.esGestorGlobal(usuario) && !esAutor && !esResponsable) {
      throw new ForbiddenException('No puede eliminar esta recomendación');
    }
    await this.prisma.recomendacion.delete({ where: { id } });
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: 'ELIMINAR',
      entidad: 'Recomendacion',
      entidadId: id,
    });
    return { eliminado: true };
  }
}
