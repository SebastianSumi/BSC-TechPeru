import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { ResolverAprobacionDto } from './aprobaciones.dto.js';

@Injectable()
export class AprobacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  pendientes() {
    return this.prisma.medicion.findMany({
      where: { estadoAprobacion: { in: ['BORRADOR', 'PENDIENTE'] } },
      include: {
        kpi: { select: { id: true, nombre: true, objetivo: true } },
        periodo: { select: { id: true, nombre: true } },
        registradoPor: { select: { id: true, nombre: true } },
        aprobaciones: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async solicitarAprobacion(medicionId: string, usuarioId?: string) {
    const medicion = await this.prisma.medicion.findUnique({
      where: { id: medicionId },
    });
    if (!medicion) throw new NotFoundException('Medición no encontrada');
    if (medicion.registradoPorId === usuarioId) {
      throw new BadRequestException(
        'No puede solicitar aprobación para una medición registrada por usted (segregación de funciones)',
      );
    }

    const actualizada = await this.prisma.medicion.update({
      where: { id: medicionId },
      data: { estadoAprobacion: 'PENDIENTE' },
    });
    await this.prisma.aprobacion.create({
      data: { medicionId, tipo: 'MEDICION', estado: 'PENDIENTE' },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'SOLICITAR_APROBACION',
      entidad: 'Medicion',
      entidadId: medicionId,
    });
    return actualizada;
  }

  async aprobar(medicionId: string, dto: ResolverAprobacionDto, usuarioId?: string) {
    const medicion = await this.prisma.medicion.findUnique({
      where: { id: medicionId },
    });
    if (!medicion) throw new NotFoundException('Medición no encontrada');
    if (medicion.registradoPorId === usuarioId) {
      throw new BadRequestException(
        'Segregación de funciones: no puede aprobar su propia medición',
      );
    }

    const [medicionUpd] = await this.prisma.$transaction([
      this.prisma.medicion.update({
        where: { id: medicionId },
        data: { estadoAprobacion: 'APROBADA' },
      }),
      this.prisma.aprobacion.create({
        data: {
          medicionId,
          tipo: dto.tipo ?? 'MEDICION',
          estado: 'APROBADA',
          aprobadorId: usuarioId,
          observacion: dto.observacion ?? '',
          resueltoEn: new Date(),
        },
      }),
    ]);
    await this.auditoria.registrar({
      usuarioId,
      accion: 'APROBAR',
      entidad: 'Medicion',
      entidadId: medicionId,
      detalle: { observacion: dto.observacion },
    });
    return medicionUpd;
  }

  async rechazar(medicionId: string, dto: ResolverAprobacionDto, usuarioId?: string) {
    const medicion = await this.prisma.medicion.findUnique({
      where: { id: medicionId },
    });
    if (!medicion) throw new NotFoundException('Medición no encontrada');

    const [medicionUpd] = await this.prisma.$transaction([
      this.prisma.medicion.update({
        where: { id: medicionId },
        data: { estadoAprobacion: 'RECHAZADA' },
      }),
      this.prisma.aprobacion.create({
        data: {
          medicionId,
          tipo: dto.tipo ?? 'MEDICION',
          estado: 'RECHAZADA',
          aprobadorId: usuarioId,
          observacion: dto.observacion ?? '',
          resueltoEn: new Date(),
        },
      }),
    ]);
    await this.auditoria.registrar({
      usuarioId,
      accion: 'RECHAZAR',
      entidad: 'Medicion',
      entidadId: medicionId,
      detalle: { observacion: dto.observacion },
    });
    return medicionUpd;
  }

  historial(medicionId: string) {
    return this.prisma.aprobacion.findMany({
      where: { medicionId },
      include: { aprobador: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
