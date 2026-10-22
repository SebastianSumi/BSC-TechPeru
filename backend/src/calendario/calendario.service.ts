import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { CreateEventoDto, UpdateEventoDto } from './calendario.dto.js';

@Injectable()
export class CalendarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar(periodoId?: string) {
    return this.prisma.eventoCalendario.findMany({
      where: periodoId ? { periodoId } : undefined,
      include: {
        periodo: { select: { id: true, nombre: true } },
        responsable: { select: { id: true, nombre: true } },
      },
      orderBy: { fecha: 'asc' },
    });
  }

  async crear(dto: CreateEventoDto, usuarioId?: string) {
    const evento = await this.prisma.eventoCalendario.create({
      data: { ...dto, fecha: new Date(dto.fecha) },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'CREAR',
      entidad: 'EventoCalendario',
      entidadId: evento.id,
      detalle: { titulo: dto.titulo },
    });
    return evento;
  }

  async actualizar(id: string, dto: UpdateEventoDto, usuarioId?: string) {
    const existe = await this.prisma.eventoCalendario.findUnique({
      where: { id },
    });
    if (!existe) throw new NotFoundException('Evento no encontrado');
    const evento = await this.prisma.eventoCalendario.update({
      where: { id },
      data: {
        ...dto,
        fecha: dto.fecha ? new Date(dto.fecha) : undefined,
      } as never,
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'ACTUALIZAR',
      entidad: 'EventoCalendario',
      entidadId: id,
      detalle: dto as Record<string, unknown>,
    });
    return evento;
  }

  async eliminar(id: string, usuarioId?: string) {
    const existe = await this.prisma.eventoCalendario.findUnique({
      where: { id },
    });
    if (!existe) throw new NotFoundException('Evento no encontrado');
    const del = await this.prisma.eventoCalendario.delete({ where: { id } });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'ELIMINAR',
      entidad: 'EventoCalendario',
      entidadId: id,
    });
    return del;
  }
}
