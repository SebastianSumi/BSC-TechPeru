import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { CreateCatalogoDto, UpdateCatalogoDto } from './catalogos.dto.js';

@Injectable()
export class CatalogosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  private empresaWhere(empresaId?: string) {
    return empresaId
      ? { OR: [{ empresaId }, { empresaId: null }] }
      : undefined;
  }

  listar(empresaId?: string, incluirInactivos = false) {
    return this.prisma.perspectiva.findMany({
      where: {
        ...(this.empresaWhere(empresaId) ?? {}),
        ...(incluirInactivos ? {} : { activo: true }),
      },
      include: {
        _count: { select: { objetivos: true } },
        objetivos: {
          where: { activo: true },
          orderBy: { orden: 'asc' },
          select: {
            id: true,
            codigo: true,
            nombre: true,
            orden: true,
            responsableId: true,
          },
        },
      },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });
  }

  async obtener(id: string, empresaId?: string) {
    const catalogo = await this.prisma.perspectiva.findFirst({
      where: { id, ...(this.empresaWhere(empresaId) ?? {}) },
      include: {
        objetivos: {
          include: {
            perspectiva: true,
            responsable: { select: { id: true, nombre: true, email: true } },
            _count: { select: { kpis: true, tareas: true } },
          },
          orderBy: { orden: 'asc' },
        },
      },
    });
    if (!catalogo) throw new NotFoundException('Catálogo no encontrado');
    return catalogo;
  }

  private async existeCodigo(
    empresaId: string,
    codigo: string,
    excluirId?: string,
  ) {
    return this.prisma.perspectiva.findFirst({
      where: {
        empresaId,
        codigo,
        ...(excluirId ? { id: { not: excluirId } } : {}),
      },
    });
  }

  async crear(
    dto: CreateCatalogoDto,
    empresaId = 'techperu',
    usuarioId?: string,
  ) {
    const codigo = dto.codigo.trim().toUpperCase();
    const existe = await this.existeCodigo(empresaId, codigo);
    if (existe) throw new BadRequestException('El código de catálogo ya existe');

    const catalogo = await this.prisma.perspectiva.create({
      data: {
        empresaId,
        codigo,
        nombre: dto.titulo,
        descripcion: dto.descripcion ?? '',
        icono: dto.icono ?? '📁',
        color: dto.color ?? '#2563eb',
        orden: dto.orden ?? 0,
        activo: dto.activo ?? true,
      },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'CREAR',
      entidad: 'Perspectiva',
      entidadId: catalogo.id,
      detalle: { codigo, empresaId },
    });
    return catalogo;
  }

  async actualizar(id: string, dto: UpdateCatalogoDto, usuarioId?: string) {
    const actual = await this.obtener(id);
    const codigo = dto.codigo ? dto.codigo.trim().toUpperCase() : undefined;
    if (codigo && codigo !== actual.codigo) {
      const existe = await this.existeCodigo(
        actual.empresaId ?? 'techperu',
        codigo,
        id,
      );
      if (existe) throw new BadRequestException('El código de catálogo ya existe');
    }
    const catalogo = await this.prisma.perspectiva.update({
      where: { id },
      data: {
        ...(codigo ? { codigo } : {}),
        ...(dto.titulo !== undefined ? { nombre: dto.titulo } : {}),
        ...(dto.descripcion !== undefined
          ? { descripcion: dto.descripcion }
          : {}),
        ...(dto.icono !== undefined ? { icono: dto.icono } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
        ...(dto.orden !== undefined ? { orden: dto.orden } : {}),
        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
      },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'ACTUALIZAR',
      entidad: 'Perspectiva',
      entidadId: id,
      detalle: dto as Record<string, unknown>,
    });
    return catalogo;
  }

  async desactivar(id: string, usuarioId?: string) {
    await this.obtener(id);
    const catalogo = await this.prisma.perspectiva.update({
      where: { id },
      data: { activo: false },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'DESACTIVAR',
      entidad: 'Perspectiva',
      entidadId: id,
    });
    return catalogo;
  }
}
