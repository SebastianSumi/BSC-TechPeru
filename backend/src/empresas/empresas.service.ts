import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { UpdateEmpresaDto } from './empresas.dto.js';

@Injectable()
export class EmpresasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar() {
    return this.prisma.empresa.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { objetivos: true, kpis: true, periodos: true } },
      },
    });
  }

  async obtener(id: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id },
      include: {
        _count: { select: { objetivos: true, kpis: true, periodos: true } },
      },
    });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return empresa;
  }

  async actualizar(id: string, dto: UpdateEmpresaDto, usuarioId?: string) {
    const actual = await this.obtener(id);
    if (dto.nombre && dto.nombre !== actual.nombre) {
      const duplicada = await this.prisma.empresa.findUnique({
        where: { nombre: dto.nombre },
      });
      if (duplicada) throw new BadRequestException('Ya existe una compañía con ese nombre');
    }
    const empresa = await this.prisma.empresa.update({
      where: { id },
      data: { ...dto },
    });
    await this.auditoria.registrar({
      usuarioId,
      accion: 'ACTUALIZAR',
      entidad: 'Empresa',
      entidadId: id,
      detalle: { ...dto },
    });
    return empresa;
  }
}
