import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import {
  CreateIniciativaDto,
  UpdateIniciativaDto,
} from './iniciativas.dto.js';

@Injectable()
export class IniciativasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar(filtros: {
    objetivoId?: string;
    estado?: string;
    empresaId?: string;
  } = {}) {
    return this.prisma.iniciativa.findMany({
      where: {
        ...(filtros.objetivoId ? { objetivoId: filtros.objetivoId } : {}),
        ...(filtros.estado ? { estado: filtros.estado as never } : {}),
        ...(filtros.empresaId
          ? { objetivoRef: { empresaId: filtros.empresaId } }
          : {}),
      },
      include: {
        objetivoRef: { include: { perspectiva: true } },
        kpi: true,
        responsable: { select: { id: true, nombre: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async obtener(id: string) {
    const ini = await this.prisma.iniciativa.findUnique({
      where: { id },
      include: { objetivoRef: true, kpi: true, responsable: true },
    });
    if (!ini) throw new NotFoundException('Iniciativa no encontrada');
    return ini;
  }

  async crear(dto: CreateIniciativaDto, usuarioId?: string) {
    const objetivo = await this.prisma.objetivo.findUnique({
      where: { id: dto.objetivoId },
    });
    if (!objetivo)
      throw new BadRequestException('La iniciativa debe vincularse a un objetivo válido');
    const existe = await this.prisma.iniciativa.findUnique({
      where: { codigo: dto.codigo },
    });
    if (existe) throw new BadRequestException('El código de iniciativa ya existe');

    const ini = await this.prisma.iniciativa.create({
      data: {
        ...dto,
        fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : new Date(),
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
      },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'CREAR',
      entidad: 'Iniciativa',
      entidadId: ini.id,
      detalle: { codigo: dto.codigo },
    });
    return ini;
  }

  async actualizar(id: string, dto: UpdateIniciativaDto, usuarioId?: string) {
    await this.obtener(id);
    const ini = await this.prisma.iniciativa.update({
      where: { id },
      data: {
        ...dto,
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
      } as never,
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'ACTUALIZAR',
      entidad: 'Iniciativa',
      entidadId: id,
      detalle: dto as Record<string, unknown>,
    });
    return ini;
  }

  async eliminar(id: string, usuarioId?: string) {
    await this.obtener(id);
    const ini = await this.prisma.iniciativa.delete({ where: { id } });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'ELIMINAR',
      entidad: 'Iniciativa',
      entidadId: id,
    });
    return ini;
  }
}
