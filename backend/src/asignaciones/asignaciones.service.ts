import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAsignacionDto } from './asignaciones.dto.js';

@Injectable()
export class AsignacionesService {
  constructor(private readonly prisma: PrismaService) {}

  listar(empresaId?: string) {
    return this.prisma.asignacion.findMany({
      where: empresaId ? { kpi: { empresaId } } : undefined,
      include: {
        usuario: { include: { rol: true } },
        kpi: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  porUsuario(usuarioId: string, empresaId?: string) {
    return this.prisma.asignacion.findMany({
      where: { usuarioId, ...(empresaId ? { kpi: { empresaId } } : {}) },
      include: { kpi: true },
    });
  }

  async crear(dto: CreateAsignacionDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuarioId },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const kpi = await this.prisma.kpi.findUnique({ where: { id: dto.kpiId } });
    if (!kpi) throw new NotFoundException('KPI no encontrado');

    const existe = await this.prisma.asignacion.findUnique({
      where: {
        usuarioId_kpiId: { usuarioId: dto.usuarioId, kpiId: dto.kpiId },
      },
    });
    if (existe) throw new BadRequestException('El objetivo ya está asignado');

    return this.prisma.asignacion.create({ data: dto });
  }

  async eliminar(id: string) {
    const asignacion = await this.prisma.asignacion.findUnique({
      where: { id },
    });
    if (!asignacion) throw new NotFoundException('Asignación no encontrada');
    return this.prisma.asignacion.delete({ where: { id } });
  }
}
