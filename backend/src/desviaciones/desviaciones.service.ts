import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import {
  CreateDesviacionDto,
  UpdateDesviacionDto,
} from './desviaciones.dto.js';

@Injectable()
export class DesviacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar(filtros: { kpiId?: string; estado?: string } = {}) {
    return this.prisma.desviacion.findMany({
      where: {
        ...(filtros.kpiId ? { kpiId: filtros.kpiId } : {}),
        ...(filtros.estado ? { estado: filtros.estado as never } : {}),
      },
      include: {
        kpi: { select: { id: true, nombre: true, objetivo: true } },
        responsable: { select: { id: true, nombre: true } },
        evidencias: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async crear(dto: CreateDesviacionDto, usuarioId?: string) {
    const kpi = await this.prisma.kpi.findUnique({ where: { id: dto.kpiId } });
    if (!kpi) throw new BadRequestException('KPI inexistente');
    const desv = await this.prisma.desviacion.create({
      data: {
        ...dto,
        fechaLimite: dto.fechaLimite ? new Date(dto.fechaLimite) : undefined,
      },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'CREAR',
      entidad: 'Desviacion',
      entidadId: desv.id,
      detalle: { kpiId: dto.kpiId },
    });
    return desv;
  }

  async actualizar(id: string, dto: UpdateDesviacionDto, usuarioId?: string) {
    const existe = await this.prisma.desviacion.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Desviación no encontrada');
    const desv = await this.prisma.desviacion.update({
      where: { id },
      data: {
        ...dto,
        fechaLimite: dto.fechaLimite ? new Date(dto.fechaLimite) : undefined,
      } as never,
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'ACTUALIZAR',
      entidad: 'Desviacion',
      entidadId: id,
      detalle: dto as Record<string, unknown>,
    });
    return desv;
  }

  async eliminar(id: string, usuarioId?: string) {
    const existe = await this.prisma.desviacion.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Desviación no encontrada');
    const desv = await this.prisma.desviacion.delete({ where: { id } });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'ELIMINAR',
      entidad: 'Desviacion',
      entidadId: id,
    });
    return desv;
  }
}
