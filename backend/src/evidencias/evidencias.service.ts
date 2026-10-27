import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { CreateEvidenciaDto } from './evidencias.dto.js';

@Injectable()
export class EvidenciasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar(filtros: {
    kpiId?: string;
    medicionId?: string;
    desviacionId?: string;
    empresaId?: string;
  } = {}) {
    return this.prisma.evidencia.findMany({
      where: {
        ...(filtros.kpiId ? { kpiId: filtros.kpiId } : {}),
        ...(filtros.medicionId ? { medicionId: filtros.medicionId } : {}),
        ...(filtros.desviacionId ? { desviacionId: filtros.desviacionId } : {}),
        ...(filtros.empresaId ? { empresaId: filtros.empresaId } : {}),
      },
      include: {
        subidoPor: { select: { id: true, nombre: true } },
        kpi: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async crear(
    dto: CreateEvidenciaDto,
    usuarioId?: string,
    empresaId = 'techperu',
  ) {
    const evidencia = await this.prisma.evidencia.create({
      data: { ...dto, empresaId, subidoPorId: usuarioId },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'CREAR',
      entidad: 'Evidencia',
      entidadId: evidencia.id,
      detalle: { titulo: dto.titulo },
    });
    return evidencia;
  }

  async eliminar(id: string, usuarioId?: string) {
    const evidencia = await this.prisma.evidencia.findUnique({
      where: { id },
    });
    if (!evidencia) throw new NotFoundException('Evidencia no encontrada');
    const del = await this.prisma.evidencia.delete({ where: { id } });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'ELIMINAR',
      entidad: 'Evidencia',
      entidadId: id,
    });
    return del;
  }
}
