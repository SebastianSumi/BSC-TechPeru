import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AuditEntry {
  usuarioId?: string | null;
  accion: string;
  entidad: string;
  entidadId?: string;
  detalle?: Record<string, unknown>;
}

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  registrar(entry: AuditEntry) {
    return this.prisma.auditoria.create({
      data: {
        usuarioId: entry.usuarioId ?? null,
        accion: entry.accion,
        entidad: entry.entidad,
        entidadId: entry.entidadId ?? '',
        detalle: entry.detalle ? (entry.detalle as object) : undefined,
      },
    });
  }

  listar(filtros: { entidad?: string; usuarioId?: string; limite?: number } = {}) {
    return this.prisma.auditoria.findMany({
      where: {
        ...(filtros.entidad ? { entidad: filtros.entidad } : {}),
        ...(filtros.usuarioId ? { usuarioId: filtros.usuarioId } : {}),
      },
      include: { usuario: { select: { id: true, nombre: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: filtros.limite ?? 200,
    });
  }
}
