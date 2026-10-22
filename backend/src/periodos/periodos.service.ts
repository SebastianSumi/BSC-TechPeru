import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePeriodoDto, UpdatePeriodoDto } from './periodos.dto.js';

@Injectable()
export class PeriodosService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.periodo.findMany({
      orderBy: [{ anio: 'desc' }, { trimestre: 'desc' }],
    });
  }

  async activo() {
    return this.prisma.periodo.findFirst({ where: { activo: true } });
  }

  private fechas(anio: number, trimestre: number) {
    const inicioMes = (trimestre - 1) * 3;
    const fechaInicio = new Date(Date.UTC(anio, inicioMes, 1));
    const fechaFin = new Date(Date.UTC(anio, inicioMes + 3, 0, 23, 59, 59));
    return { fechaInicio, fechaFin };
  }

  async crear(dto: CreatePeriodoDto) {
    const existe = await this.prisma.periodo.findUnique({
      where: { nombre: dto.nombre },
    });
    if (existe) throw new BadRequestException('El período ya existe');
    const { fechaInicio, fechaFin } = this.fechas(dto.anio, dto.trimestre);
    return this.prisma.periodo.create({
      data: { ...dto, fechaInicio, fechaFin },
    });
  }

  async actualizar(id: string, dto: UpdatePeriodoDto) {
    await this.obtener(id);
    if (dto.activo === true) {
      await this.prisma.periodo.updateMany({
        where: { activo: true },
        data: { activo: false },
      });
    }
    return this.prisma.periodo.update({ where: { id }, data: dto });
  }

  async activar(id: string) {
    await this.obtener(id);
    await this.prisma.periodo.updateMany({
      where: { activo: true },
      data: { activo: false },
    });
    return this.prisma.periodo.update({
      where: { id },
      data: { activo: true },
    });
  }

  async obtener(id: string) {
    const periodo = await this.prisma.periodo.findUnique({ where: { id } });
    if (!periodo) throw new NotFoundException('Período no encontrado');
    return periodo;
  }

  async eliminar(id: string) {
    await this.obtener(id);
    await this.prisma.medicion.deleteMany({ where: { periodoId: id } });
    return this.prisma.periodo.delete({ where: { id } });
  }
}
