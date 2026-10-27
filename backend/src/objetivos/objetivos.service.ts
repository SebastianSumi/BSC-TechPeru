import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { AccesoService, type UsuarioSesion } from '../comun/acceso.service.js';
import { CreateObjetivoDto, UpdateObjetivoDto } from './objetivos.dto.js';

function codigoPerspectiva(codigo: string): string {
  return codigo
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

@Injectable()
export class ObjetivosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly acceso: AccesoService,
  ) {}

  listar(
    perspectivaId?: string,
    incluirInactivos = false,
    empresaId?: string,
  ) {
    return this.prisma.objetivo.findMany({
      where: {
        ...(perspectivaId ? { perspectivaId } : {}),
        ...(empresaId ? { empresaId } : {}),
        ...(incluirInactivos ? {} : { activo: true }),
      },
      include: {
        perspectiva: true,
        responsable: { select: { id: true, nombre: true, email: true } },
        _count: { select: { kpis: true, tareas: true } },
      },
      orderBy: [{ perspectivaId: 'asc' }, { orden: 'asc' }],
    });
  }

  async agrupados(empresaId?: string, incluirInactivos = false) {
    const [perspectivas, objetivos] = await Promise.all([
      this.prisma.perspectiva.findMany({
        where: {
          ...(empresaId
            ? { OR: [{ empresaId }, { empresaId: null }] }
            : {}),
          ...(incluirInactivos ? {} : { activo: true }),
        },
        orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      }),
      this.listar(undefined, incluirInactivos, empresaId),
    ]);
    return perspectivas.map((perspectiva) => ({
      perspectivaId: perspectiva.id,
      codigoPerspectiva: perspectiva.codigo || perspectiva.id,
      tituloPerspectiva: perspectiva.nombre,
      perspectiva,
      objetivos: objetivos.filter((o) => o.perspectivaId === perspectiva.id),
    }));
  }

  async obtener(id: string) {
    const objetivo = await this.prisma.objetivo.findUnique({
      where: { id },
      include: {
        perspectiva: true,
        responsable: { select: { id: true, nombre: true, email: true } },
        kpis: {
          include: {
            responsable: { select: { id: true, nombre: true, email: true } },
            asignaciones: {
              include: {
                usuario: { select: { id: true, nombre: true, email: true } },
              },
            },
          },
        },
        tareas: {
          include: {
            responsable: { select: { id: true, nombre: true } },
            resultados: { include: { evidencias: true } },
            evidencias: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        recomendaciones: {
          include: { autor: { select: { id: true, nombre: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!objetivo) throw new NotFoundException('Objetivo no encontrado');
    return objetivo;
  }

  private async validarPerspectiva(perspectivaId: string, empresaId: string) {
    const perspectiva = await this.prisma.perspectiva.findFirst({
      where: {
        id: perspectivaId,
        activo: true,
        OR: [{ empresaId }, { empresaId: null }],
      },
    });
    if (!perspectiva) {
      throw new BadRequestException(
        'El catálogo (perspectiva) no existe, está inactivo o pertenece a otra empresa',
      );
    }
    return perspectiva;
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

  private async generarCodigo(
    tx: Prisma.TransactionClient,
    perspectiva: { id: string; codigo: string },
    empresaId: string,
  ) {
    await tx.$queryRawUnsafe(
      'SELECT pg_advisory_xact_lock(hashtext($1))',
      `objetivo:${empresaId}:${perspectiva.id}`,
    );
    const prefijo = `OBJ-${codigoPerspectiva(perspectiva.codigo || perspectiva.id)}`;
    const existentes = await tx.objetivo.findMany({
      where: { codigo: { startsWith: prefijo } },
      select: { codigo: true },
    });
    let maximo = 0;
    for (const item of existentes) {
      const sufijo = item.codigo.slice(prefijo.length);
      if (/^\d+$/.test(sufijo)) {
        maximo = Math.max(maximo, Number(sufijo));
      }
    }
    return `${prefijo}${maximo + 1}`;
  }

  async crear(
    dto: CreateObjetivoDto,
    usuarioId?: string,
    empresaId = 'techperu',
  ) {
    const perspectiva = await this.validarPerspectiva(
      dto.perspectivaId,
      empresaId,
    );
    await this.validarResponsable(dto.responsableId);

    const codigo = dto.codigo?.trim().toUpperCase();
    if (codigo) {
      const existe = await this.prisma.objetivo.findUnique({
        where: { codigo },
      });
      if (existe) throw new BadRequestException('El código de objetivo ya existe');
    }

    const objetivo = await this.prisma.$transaction(async (tx) => {
      const codigoFinal =
        codigo ?? (await this.generarCodigo(tx, perspectiva, empresaId));
      return tx.objetivo.create({
        data: {
          codigo: codigoFinal,
          nombre: dto.nombre,
          descripcion: dto.descripcion ?? '',
          perspectivaId: perspectiva.id,
          responsableId: dto.responsableId || null,
          ponderacion: dto.ponderacion ?? 0,
          orden: dto.orden ?? 0,
          empresaId,
        },
      });
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'CREAR',
      entidad: 'Objetivo',
      entidadId: objetivo.id,
      detalle: { codigo: objetivo.codigo, perspectivaId: perspectiva.id },
    });
    return objetivo;
  }

  async actualizar(id: string, dto: UpdateObjetivoDto, usuario?: UsuarioSesion) {
    const actual = await this.obtener(id);
    if (!this.acceso.puedeEditarObjetivo(usuario, actual)) {
      throw new ForbiddenException('No puede modificar este objetivo');
    }
    let perspectiva:
      | { id: string; codigo: string; empresaId: string | null }
      | null = null;
    if (dto.perspectivaId && dto.perspectivaId !== actual.perspectivaId) {
      perspectiva = await this.validarPerspectiva(
        dto.perspectivaId,
        actual.empresaId,
      );
    }
    await this.validarResponsable(dto.responsableId);

    const objetivo = await this.prisma.$transaction(async (tx) => {
      let codigo: string | undefined;
      if (perspectiva) {
        codigo = await this.generarCodigo(tx, perspectiva, actual.empresaId);
      }
      return tx.objetivo.update({
        where: { id },
        data: {
          nombre: dto.nombre,
          descripcion: dto.descripcion,
          perspectivaId: dto.perspectivaId,
          responsableId:
            dto.responsableId === undefined
              ? undefined
              : dto.responsableId || null,
          ponderacion: dto.ponderacion,
          orden: dto.orden,
          activo: dto.activo,
          ...(codigo ? { codigo } : {}),
        },
      });
    });
    await this.auditoria.registrar({
      usuarioId: usuario?.id,
      accion: 'ACTUALIZAR',
      entidad: 'Objetivo',
      entidadId: id,
      detalle: dto as Record<string, unknown>,
    });
    return objetivo;
  }

  async desactivar(id: string, usuario?: UsuarioSesion) {
    const actual = await this.obtener(id);
    if (!this.acceso.puedeEditarObjetivo(usuario, actual)) {
      throw new ForbiddenException('No puede desactivar este objetivo');
    }
    const objetivo = await this.prisma.objetivo.update({
      where: { id },
      data: { activo: false },
    });
    await this.auditoria.registrar({
      usuarioId: usuario?.id,
      accion: 'DESACTIVAR',
      entidad: 'Objetivo',
      entidadId: id,
    });
    return objetivo;
  }
}
