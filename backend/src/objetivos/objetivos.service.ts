import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { CreateObjetivoDto, UpdateObjetivoDto } from './objetivos.dto.js';

@Injectable()
export class ObjetivosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar(perspectivaId?: string, incluirInactivos = false) {
    return this.prisma.objetivo.findMany({
      where: {
        ...(perspectivaId ? { perspectivaId } : {}),
        ...(incluirInactivos ? {} : { activo: true }),
      },
      include: { perspectiva: true, _count: { select: { kpis: true } } },
      orderBy: [{ perspectivaId: 'asc' }, { orden: 'asc' }],
    });
  }

  async obtener(id: string) {
    const objetivo = await this.prisma.objetivo.findUnique({
      where: { id },
      include: { perspectiva: true, kpis: true },
    });
    if (!objetivo) throw new NotFoundException('Objetivo no encontrado');
    return objetivo;
  }

  async crear(dto: CreateObjetivoDto, usuarioId?: string) {
    const perspectiva = await this.prisma.perspectiva.findUnique({
      where: { id: dto.perspectivaId },
    });
    if (!perspectiva) throw new BadRequestException('Perspectiva inexistente');

    const existe = await this.prisma.objetivo.findUnique({
      where: { codigo: dto.codigo },
    });
    if (existe) throw new BadRequestException('El código de objetivo ya existe');

    const objetivo = await this.prisma.objetivo.create({ data: dto });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'CREAR',
      entidad: 'Objetivo',
      entidadId: objetivo.id,
      detalle: { codigo: dto.codigo },
    });
    return objetivo;
  }

  async actualizar(id: string, dto: UpdateObjetivoDto, usuarioId?: string) {
    await this.obtener(id);
    const objetivo = await this.prisma.objetivo.update({
      where: { id },
      data: dto,
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'ACTUALIZAR',
      entidad: 'Objetivo',
      entidadId: id,
      detalle: dto as Record<string, unknown>,
    });
    return objetivo;
  }

  async desactivar(id: string, usuarioId?: string) {
    await this.obtener(id);
    const objetivo = await this.prisma.objetivo.update({
      where: { id },
      data: { activo: false },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'DESACTIVAR',
      entidad: 'Objetivo',
      entidadId: id,
    });
    return objetivo;
  }
}
