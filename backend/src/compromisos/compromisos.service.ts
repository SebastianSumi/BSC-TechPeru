import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import {
  CreateCompromisoDto,
  UpdateCompromisoDto,
} from './compromisos.dto.js';

@Injectable()
export class CompromisosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar(filtros: {
    estado?: string;
    responsableId?: string;
    empresaId?: string;
  } = {}) {
    return this.prisma.compromiso.findMany({
      where: {
        ...(filtros.estado ? { estado: filtros.estado as never } : {}),
        ...(filtros.responsableId
          ? { responsableId: filtros.responsableId }
          : {}),
        ...(filtros.empresaId
          ? { objetivoRef: { empresaId: filtros.empresaId } }
          : {}),
      },
      include: {
        objetivoRef: { select: { id: true, codigo: true, nombre: true } },
        kpi: { select: { id: true, nombre: true } },
        responsable: { select: { id: true, nombre: true } },
      },
      orderBy: { fechaLimite: 'asc' },
    });
  }

  async crear(dto: CreateCompromisoDto, usuarioId?: string) {
    const compromiso = await this.prisma.compromiso.create({
      data: {
        ...dto,
        fechaLimite: dto.fechaLimite ? new Date(dto.fechaLimite) : undefined,
      },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'CREAR',
      entidad: 'Compromiso',
      entidadId: compromiso.id,
      detalle: { reunion: dto.reunion },
    });
    return compromiso;
  }

  async actualizar(id: string, dto: UpdateCompromisoDto, usuarioId?: string) {
    const existe = await this.prisma.compromiso.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Compromiso no encontrado');
    const compromiso = await this.prisma.compromiso.update({
      where: { id },
      data: {
        ...dto,
        fechaLimite: dto.fechaLimite ? new Date(dto.fechaLimite) : undefined,
      } as never,
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'ACTUALIZAR',
      entidad: 'Compromiso',
      entidadId: id,
      detalle: dto as Record<string, unknown>,
    });
    return compromiso;
  }

  async eliminar(id: string, usuarioId?: string) {
    const existe = await this.prisma.compromiso.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Compromiso no encontrado');
    const del = await this.prisma.compromiso.delete({ where: { id } });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'ELIMINAR',
      entidad: 'Compromiso',
      entidadId: id,
    });
    return del;
  }
}
